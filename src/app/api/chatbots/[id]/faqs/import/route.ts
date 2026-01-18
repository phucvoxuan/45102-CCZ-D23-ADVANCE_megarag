import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/auth-server';
import { supabaseAdmin } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/chatbots/[id]/faqs/import - Import FAQs from CSV
 *
 * Accepts CSV data with format: question,answer
 * First row should be header row (will be skipped)
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify chatbot ownership
    const { data: chatbot } = await supabaseAdmin
      .from('chatbot_widgets')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!chatbot) {
      return NextResponse.json({ error: 'Chatbot not found' }, { status: 404 });
    }

    const body = await request.json();
    const { csvData } = body;

    if (!csvData || typeof csvData !== 'string') {
      return NextResponse.json({ error: 'CSV data is required' }, { status: 400 });
    }

    // Parse CSV
    const lines = csvData.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      return NextResponse.json({
        error: 'CSV must have at least a header row and one data row'
      }, { status: 400 });
    }

    // Skip header row, parse data rows
    const faqs: { question: string; answer: string }[] = [];
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Parse CSV line (handling quoted fields)
      const parts = parseCSVLine(line);

      if (parts.length < 2) {
        errors.push(`Row ${i + 1}: Invalid format (need question and answer)`);
        continue;
      }

      const question = parts[0].trim();
      const answer = parts[1].trim();

      if (!question || !answer) {
        errors.push(`Row ${i + 1}: Question or answer is empty`);
        continue;
      }

      faqs.push({ question, answer });
    }

    if (faqs.length === 0) {
      return NextResponse.json({
        error: 'No valid FAQs found in CSV',
        details: errors
      }, { status: 400 });
    }

    // Get current max sort_order
    const { data: maxOrder } = await supabaseAdmin
      .from('widget_faqs')
      .select('sort_order')
      .eq('widget_id', id)
      .order('sort_order', { ascending: false })
      .limit(1)
      .single();

    let nextOrder = (maxOrder?.sort_order || 0) + 1;

    // Insert FAQs
    const faqsToInsert = faqs.map((faq, index) => ({
      widget_id: id,
      question: faq.question,
      answer: faq.answer,
      status: 'active',
      sort_order: nextOrder + index,
      source: 'imported',
    }));

    const { data: insertedFaqs, error: insertError } = await supabaseAdmin
      .from('widget_faqs')
      .insert(faqsToInsert)
      .select();

    if (insertError) {
      console.error('Error inserting FAQs:', insertError);
      return NextResponse.json({ error: 'Failed to import FAQs' }, { status: 500 });
    }

    return NextResponse.json({
      faqs: insertedFaqs,
      imported: insertedFaqs?.length || 0,
      skipped: errors.length,
      errors: errors.length > 0 ? errors : undefined,
      message: `Successfully imported ${insertedFaqs?.length || 0} FAQs`
    });
  } catch (error) {
    console.error('Import FAQs error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/chatbots/[id]/faqs/import - Download CSV template
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Return CSV template
    const csvTemplate = `question,answer
"Thời gian giao hàng bao lâu?","Thời gian giao hàng từ 2-5 ngày làm việc tùy khu vực."
"Làm sao để đổi trả hàng?","Quý khách có thể đổi trả trong vòng 7 ngày kể từ ngày nhận hàng."
"Phí vận chuyển bao nhiêu?","Miễn phí vận chuyển cho đơn hàng từ 500.000đ trở lên."`;

    return new Response(csvTemplate, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="faq_template.csv"',
      },
    });
  } catch (error) {
    console.error('Download template error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Parse a CSV line, handling quoted fields
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  // Add last field
  result.push(current);

  return result;
}
