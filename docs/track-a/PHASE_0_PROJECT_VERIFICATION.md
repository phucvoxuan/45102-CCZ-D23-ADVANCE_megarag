# PHASE 0: PROJECT VERIFICATION & LOCALHOST SETUP

## Mục tiêu
Kiểm tra toàn bộ cấu trúc project MegaRAG, verify dependencies, và chạy localhost trên port khả dụng (tránh 3000, 3100).

---

## PROMPT CHO CLAUDE CODE

Copy và paste prompt sau vào Claude Code:

```
Tôi cần bạn thực hiện các bước sau để verify và chạy project MegaRAG:

## BƯỚC 1: PHÂN TÍCH CẤU TRÚC PROJECT

Hãy đọc và phân tích toàn bộ cấu trúc thư mục của project:
- Liệt kê tất cả folders và files quan trọng
- Xác định framework đang sử dụng (Next.js version)
- Kiểm tra file package.json để xem dependencies
- Kiểm tra file .env.example để biết các biến môi trường cần thiết

## BƯỚC 2: KIỂM TRA ENVIRONMENT

1. Kiểm tra xem file .env hoặc .env.local đã tồn tại chưa
2. Nếu chưa có, tạo file .env.local từ .env.example với các placeholder values
3. Liệt kê các biến môi trường BẮT BUỘC cần có để chạy được app

## BƯỚC 3: KIỂM TRA DEPENDENCIES

1. Chạy `npm install` hoặc `pnpm install` để cài đặt dependencies
2. Kiểm tra xem có lỗi dependency nào không
3. Báo cáo các peer dependency warnings (nếu có)

## BƯỚC 4: KIỂM TRA PORT KHẢ DỤNG

Port 3000 và 3100 đã được sử dụng. Hãy:
1. Kiểm tra port 3001, 3002, 3003 xem port nào khả dụng
2. Chọn port khả dụng đầu tiên
3. Cấu hình để chạy trên port đó

## BƯỚC 5: CHẠY DEVELOPMENT SERVER

1. Chạy `npm run dev` hoặc `pnpm dev` với port đã chọn
2. Nếu có lỗi, phân tích và đề xuất cách fix
3. Xác nhận URL để truy cập (ví dụ: http://localhost:3001)

## BƯỚC 6: BÁO CÁO TỔNG HỢP

Sau khi hoàn thành, hãy tạo báo cáo gồm:
1. Cấu trúc project (tree view)
2. Tech stack đang sử dụng
3. Các biến môi trường cần cấu hình
4. URL localhost để test
5. Các vấn đề cần lưu ý (nếu có)
6. Workflow chính của app (dựa trên phân tích code)

## LƯU Ý QUAN TRỌNG
- Nếu thiếu .env file, app có thể không chạy được - hãy tạo với dummy values để test UI
- Nếu cần Supabase, hãy ghi chú lại để setup sau
- Nếu có lỗi build, ưu tiên fix lỗi blocking trước
```

---

## COMMAND LINE ALTERNATIVE

Nếu muốn chạy manual, sử dụng các lệnh sau:

```bash
# 1. Xem cấu trúc project
find . -type f -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.json" | head -50

# 2. Kiểm tra package.json
cat package.json

# 3. Cài đặt dependencies
npm install

# 4. Tạo .env.local nếu chưa có
cp .env.example .env.local 2>/dev/null || echo "No .env.example found"

# 5. Chạy trên port 3001
PORT=3001 npm run dev

# Hoặc với Next.js
npx next dev -p 3001
```

---

## EXPECTED OUTPUT

Sau khi chạy thành công, bạn sẽ thấy:

```
▲ Next.js 15.x.x (hoặc version tương ứng)
- Local:        http://localhost:3001
- Environments: .env.local

✓ Ready in X.Xs
```

---

## CHECKLIST SAU PHASE 0

- [ ] Project structure đã được phân tích
- [ ] Dependencies đã cài đặt thành công
- [ ] .env.local đã được tạo (hoặc đã có)
- [ ] Development server chạy được trên port khả dụng
- [ ] Có thể truy cập UI qua browser
- [ ] Đã xác định các features cần implement cho Track A

---

## TROUBLESHOOTING

### Lỗi: Module not found
```bash
rm -rf node_modules package-lock.json
npm install
```

### Lỗi: Port already in use
```bash
# Tìm process đang dùng port
lsof -i :3001
# Kill process
kill -9 <PID>
# Hoặc dùng port khác
PORT=3002 npm run dev
```

### Lỗi: Missing environment variables
```bash
# Tạo .env.local với các giá trị mẫu
cat > .env.local << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
GEMINI_API_KEY=your_gemini_key
EOF
```

---

## NEXT STEP

Sau khi Phase 0 hoàn thành và verify được:
1. UI chạy được
2. Hiểu rõ cấu trúc project
3. Biết các features hiện có

→ Tiến hành **Phase A1: Authentication**
