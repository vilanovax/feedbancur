"use client";

import { memo } from "react";
import { PrefetchLink } from "@/components/ui/prefetch-link";
import { LucideIcon } from "lucide-react";
import { ChevronDown, ChevronUp } from "lucide-react";

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

interface SidebarNavItemProps {
  item: NavItem;
  isActive: (path: string) => boolean;
  isExpanded: boolean;
  hasActiveSubItem: boolean;
  userRole: string;
  onToggleMenu: () => void;
  onCloseSidebar: () => void;
}

function SidebarNavItem({
  item,
  isActive,
  isExpanded,
  hasActiveSubItem,
  userRole,
  onToggleMenu,
  onCloseSidebar,
}: SidebarNavItemProps) {
  const Icon = item.icon;
  const hasSubItems = item.subItems && item.subItems.length > 0;

  if (hasSubItems) {
    return (
      <li>
        <div className="flex items-center">
          <PrefetchLink
            href={item.href}
            onClick={onCloseSidebar}
            className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
              isActive(item.href) && !hasActiveSubItem
                ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md"
                : "text-gray-700 hover:bg-blue-50 hover:text-blue-700"
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="font-medium">{item.name}</span>
          </PrefetchLink>
          <button
            onClick={onToggleMenu}
            className={`px-2 py-3 rounded-lg transition-all duration-200 ${
              isActive(item.href) || hasActiveSubItem
                ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white"
                : "text-gray-700 hover:bg-blue-50 hover:text-blue-700"
            }`}
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>
        {isExpanded && item.subItems && (
          <ul className="mr-4 mt-2 space-y-1">
            {item.subItems
              .filter((subItem) => subItem.roles.includes(userRole))
              .map((subItem) => {
                const SubIcon = subItem.icon;
                return (
                  <li key={subItem.href}>
                    <PrefetchLink
                      href={subItem.href}
                      onClick={onCloseSidebar}
                      className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 text-sm ${
                        isActive(subItem.href)
                          ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm"
                          : "text-gray-600 hover:bg-blue-50 hover:text-blue-700"
                      }`}
                    >
                      <SubIcon className="w-4 h-4" />
                      <span>{subItem.name}</span>
                    </PrefetchLink>
                  </li>
                );
              })}
          </ul>
        )}
      </li>
    );
  }

  return (
    <li>
      <PrefetchLink
        href={item.href}
        onClick={onCloseSidebar}
        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
          isActive(item.href)
            ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md"
            : "text-gray-700 hover:bg-blue-50 hover:text-blue-700"
        }`}
      >
        <Icon className="w-5 h-5" />
        <span className="font-medium">{item.name}</span>
      </PrefetchLink>
    </li>
  );
}

export default memo(SidebarNavItem);
