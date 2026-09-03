import React, { useState } from 'react'
import { Search, LayoutDashboard, ShoppingBag, Users, Settings, LogOut, ChevronRight } from 'lucide-react'
import type { T } from '../lib/i18n'

export type NavItemData = {
  id: string
  title: string
  icon: React.ElementType
  badge?: number | string
  shortcut?: string
  children?: NavItemData[]
}
export type NavGroupData = { heading?: string; items: NavItemData[] }

const navGroups = (t: T, ordersBadge?: number): NavGroupData[] => [
  {
    items: [
      { id: 'search', title: t('nav.search'), icon: Search, shortcut: '⌘K' },
      { id: 'dashboard', title: t('nav.dashboard'), icon: LayoutDashboard },
      { id: 'orders', title: t('nav.orders'), icon: ShoppingBag, badge: ordersBadge || undefined },
      { id: 'customers', title: t('nav.customers'), icon: Users },
    ],
  },
]
const bottomItems = (t: T): NavItemData[] => [
  { id: 'settings', title: t('nav.settings'), icon: Settings, shortcut: '⌘,' },
  { id: 'logout', title: t('nav.logout'), icon: LogOut },
]

function CompanyHeader({ name, subtitle }: { name: string; subtitle: string }) {
  return (
    <div className="flex items-center gap-3 px-2 py-2 mb-4 select-none">
      <div className="w-8 h-8 rounded-[6px] bg-primary text-primary-foreground flex items-center justify-center font-semibold text-[13px] shadow-sm">
        {name.charAt(0)}
      </div>
      <div className="flex flex-col overflow-hidden">
        <span className="text-[13px] font-medium leading-none mb-1 text-foreground truncate max-w-[160px]">{name}</span>
        <span className="text-[11px] text-muted-foreground leading-none">{subtitle}</span>
      </div>
    </div>
  )
}

function NavItem({ item, activeId, onSelect, level = 0 }: { item: NavItemData; activeId: string; onSelect: (id: string) => void; level?: number }) {
  const isActive = activeId === item.id
  const hasChildren = !!item.children
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="flex flex-col w-full">
      <div
        className={`group flex items-center justify-between px-2.5 py-[7px] rounded-[6px] cursor-pointer transition-all duration-200 select-none
          ${isActive ? 'bg-black/5 dark:bg-white/10 text-foreground font-medium' : 'text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground/90'}`}
        style={{ paddingLeft: `${level * 12 + 10}px` }}
        onClick={() => (hasChildren ? setIsOpen(!isOpen) : onSelect(item.id))}
      >
        <div className="flex items-center gap-2.5">
          <item.icon className={`w-[16px] h-[16px] transition-colors ${isActive ? 'text-foreground' : 'text-muted-foreground/70 group-hover:text-foreground/70'}`} strokeWidth={1.5} />
          <span className="text-[13px] tracking-wide truncate">{item.title}</span>
        </div>
        <div className="flex items-center gap-2">
          {item.shortcut && (
            <kbd className="hidden group-hover:inline-flex items-center justify-center h-5 px-1.5 text-[10px] font-medium font-mono text-muted-foreground/60 bg-background/50 border border-border/50 rounded-[4px]">
              {item.shortcut}
            </kbd>
          )}
          {item.badge && (
            <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-medium rounded-full bg-primary/10 text-primary">{item.badge}</span>
          )}
          {hasChildren && <ChevronRight className={`w-3.5 h-3.5 text-muted-foreground/50 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} strokeWidth={2} />}
        </div>
      </div>
      {hasChildren && (
        <div className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
          <div className="overflow-hidden min-h-0 relative flex flex-col gap-0.5 mt-0.5">
            <div className="absolute top-0 bottom-0 border-l border-black/5 dark:border-white/5" style={{ left: `${level * 12 + 17.5}px` }} />
            {item.children!.map(child => <NavItem key={child.id} item={child} activeId={activeId} onSelect={onSelect} level={level + 1} />)}
          </div>
        </div>
      )}
    </div>
  )
}

export function SidebarNav({ className = '', activeId, onSelect, company, subtitle, ordersBadge, t }: {
  className?: string; activeId: string; onSelect: (id: string) => void; company: string; subtitle: string; ordersBadge?: number; t: T
}) {
  return (
    <div className={`flex flex-col w-[260px] h-full bg-card/50 border-r border-border/50 p-3 font-sans ${className}`}>
      <CompanyHeader name={company} subtitle={subtitle} />
      <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] flex flex-col gap-4 mt-2">
        {navGroups(t, ordersBadge).map((group, idx) => (
          <div key={idx} className="flex flex-col gap-0.5">
            {group.heading && <span className="px-2.5 mb-1 text-[11px] font-semibold tracking-wider text-muted-foreground/50 uppercase">{group.heading}</span>}
            {group.items.map(item => <NavItem key={item.id} item={item} activeId={activeId} onSelect={onSelect} />)}
          </div>
        ))}
      </div>
      <div className="mt-auto pt-4 border-t border-border/50 flex flex-col gap-0.5">
        {bottomItems(t).map(item => <NavItem key={item.id} item={item} activeId={activeId} onSelect={onSelect} />)}
      </div>
    </div>
  )
}
