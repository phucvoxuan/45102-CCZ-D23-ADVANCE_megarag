'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  User,
  Settings,
  CreditCard,
  LogOut,
  Shield,
  Sparkles,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

// Super Admin Email - CHỈ email này mới thấy System Admin link
const SUPER_ADMIN_EMAIL = 'phucvoxuan@gmail.com'

interface UserNavProps {
  showAuthButtons?: boolean
}

export function UserNav({ showAuthButtons = true }: UserNavProps) {
  const { user, profile, subscription, isLoading, signOut } = useAuth()

  // Check if current user is super admin
  const isSuperAdmin = user?.email === SUPER_ADMIN_EMAIL

  // Check if user is on FREE plan (show upgrade button)
  const isFreePlan = !subscription || subscription.plan_name === 'FREE'

  if (isLoading) {
    return (
      <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />
    )
  }

  if (!user) {
    // Only show Sign In button if showAuthButtons is true
    if (!showAuthButtons) {
      return null
    }
    return (
      <Button asChild variant="outline" size="sm">
        <Link href="/login">Sign In</Link>
      </Button>
    )
  }

  const displayName = profile?.full_name || user.email?.split('@')[0] || 'User'
  const initials = displayName.slice(0, 2).toUpperCase()

  return (
    <div className="flex items-center gap-3">
      {/* Upgrade Plan Button - Chỉ hiện cho FREE users */}
      {isFreePlan && (
        <Button
          asChild
          size="sm"
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium"
        >
          <Link href="/pricing">
            <Sparkles className="mr-2 h-4 w-4" />
            Upgrade Plan
          </Link>
        </Button>
      )}

      {/* User Menu Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-9 w-9 rounded-full">
            {/* Simple Avatar */}
            <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-medium text-sm">
              {initials}
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{displayName}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {user.email}
              </p>
              {subscription && (
                <span className={`text-xs mt-1 px-2 py-0.5 rounded-full inline-block w-fit ${
                  subscription.plan_name === 'FREE' ? 'bg-gray-100 text-gray-600' :
                  subscription.plan_name === 'STARTER' ? 'bg-blue-100 text-blue-600' :
                  subscription.plan_name === 'PRO' ? 'bg-purple-100 text-purple-600' :
                  'bg-orange-100 text-orange-600'
                }`}>
                  {subscription.plan_name}
                </span>
              )}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuGroup>
            {/* Profile */}
            <DropdownMenuItem asChild>
              <Link href="/admin/profile" className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>

            {/* Billing */}
            <DropdownMenuItem asChild>
              <Link href="/admin/billing" className="cursor-pointer">
                <CreditCard className="mr-2 h-4 w-4" />
                Billing & Usage
              </Link>
            </DropdownMenuItem>

            {/* Settings */}
            <DropdownMenuItem asChild>
              <Link href="/admin/settings" className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>

          {/* SUPER ADMIN SECTION - Chỉ hiện cho phucvoxuan@gmail.com */}
          {isSuperAdmin && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                  <Link
                    href="/system-admin"
                    className="cursor-pointer text-orange-600 hover:text-orange-700 font-medium"
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    System Admin
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </>
          )}

          <DropdownMenuSeparator />

          {/* Sign Out */}
          <DropdownMenuItem
            onClick={signOut}
            className="cursor-pointer text-red-600 hover:text-red-700"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
