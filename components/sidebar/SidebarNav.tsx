"use client";

import { LucideIcon } from "lucide-react";
import { SidebarNavItem } from "./";

interface SubItem {
  name: string;
  href: string;
  icon: LucideIcon;
  roles: string[];
}

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  roles: string[];
  subItems?: SubItem[];
}

interface SidebarNavProps {
  navItems: NavItem[];
  userRole: string;
  expandedMenus: string[];
  isActive: (path: string) => boolean;
  onToggleMenu: (menuName: string) => void;
  onCloseSidebar: () => void;
}

export default function SidebarNav({
  navItems,
  userRole,
  expandedMenus,
  isActive,
  onToggleMenu,
  onCloseSidebar,
}: SidebarNavProps) {
  return (
    <nav className="flex-1 p-4 overflow-y-auto bg-white">
      <ul className="space-y-1">
        {navItems.map((item) => {
          const isExpanded = expandedMenus.includes(item.name);
          const hasActiveSubItem = item.subItems?.some(
            (subItem) =>
              subItem.roles.includes(userRole) && isActive(subItem.href)
          );

          return (
            <SidebarNavItem
              key={item.href}
              item={item}
              isActive={isActive}
              isExpanded={isExpanded}
              hasActiveSubItem={hasActiveSubItem || false}
              userRole={userRole}
              onToggleMenu={() => onToggleMenu(item.name)}
              onCloseSidebar={onCloseSidebar}
            />
          );
        })}
      </ul>
    </nav>
  );
}
