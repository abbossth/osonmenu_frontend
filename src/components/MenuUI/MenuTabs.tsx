"use client";

import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faArrowRight, faPen, faPlus, faTrashCan } from "@fortawesome/free-solid-svg-icons";

type MenuTab = {
  id: string;
  name: string;
};

type MenuTabsProps = {
  menus: MenuTab[];
  activeMenuId: string | null;
  accentColor?: string;
  isLight?: boolean;
  isAdmin?: boolean;
  onMoveLeft?: (menuId: string) => void;
  onMoveRight?: (menuId: string) => void;
  onEdit?: (menuId: string) => void;
  onDelete?: (menuId: string) => void;
  onAddLeft?: () => void;
  onAddRight?: () => void;
  onSelect: (menuId: string) => void;
};

export function MenuTabs({
  menus,
  activeMenuId,
  accentColor = "#ff4048",
  isLight = false,
  isAdmin = false,
  onMoveLeft,
  onMoveRight,
  onEdit,
  onDelete,
  onAddLeft,
  onAddRight,
  onSelect,
}: MenuTabsProps) {
  return (
    <div
      className={`sticky top-0 z-20 -mx-1 rounded-2xl px-1 py-1.5 backdrop-blur ${
        isLight ? "bg-white/95" : "bg-[#0f0f0f]/95"
      }`}
    >
      <div className="flex items-start gap-2 overflow-x-auto pb-0.5">
        {isAdmin ? (
          <button
            type="button"
            onClick={onAddLeft}
            className="h-8 w-8 shrink-0 cursor-pointer self-start rounded-full text-sm font-semibold text-white shadow-sm"
            style={{ backgroundColor: accentColor }}
          >
            <FontAwesomeIcon icon={faPlus} />
          </button>
        ) : null}
        {menus.map((menu) => {
          const active = menu.id === activeMenuId;
          return (
            <div key={menu.id} className="shrink-0 space-y-1">
              <button
                type="button"
                onClick={() => onSelect(menu.id)}
                className={`relative cursor-pointer rounded-full px-5 py-2 text-sm font-semibold transition ${
                  active
                    ? "text-white"
                    : "border hover:brightness-95"
                }`}
                style={!active ? { borderColor: accentColor, color: accentColor } : undefined}
              >
                {active ? (
                  <motion.span
                    layoutId="menu-active-pill"
                    className="absolute inset-0 rounded-full"
                    style={{ backgroundColor: accentColor }}
                    transition={{ type: "spring", stiffness: 320, damping: 30 }}
                  />
                ) : null}
                <span className="relative z-10">{menu.name}</span>
              </button>
              {isAdmin ? (
                <div
                  className={`flex items-center justify-center gap-1 rounded-full px-2 py-1 text-xs ${
                    isLight ? "border border-neutral-200 bg-neutral-100 text-neutral-700" : "border border-white/10 bg-black/40 text-white"
                  }`}
                >
                  <button type="button" onClick={() => onMoveLeft?.(menu.id)} className="cursor-pointer">
                    <FontAwesomeIcon icon={faArrowLeft} />
                  </button>
                  <button type="button" onClick={() => onEdit?.(menu.id)} className="cursor-pointer">
                    <FontAwesomeIcon icon={faPen} />
                  </button>
                  <button type="button" onClick={() => onMoveRight?.(menu.id)} className="cursor-pointer">
                    <FontAwesomeIcon icon={faArrowRight} />
                  </button>
                  <button type="button" onClick={() => onDelete?.(menu.id)} className="cursor-pointer">
                    <FontAwesomeIcon icon={faTrashCan} />
                  </button>
                </div>
              ) : null}
            </div>
          );
        })}
        {isAdmin ? (
          <button
            type="button"
            onClick={onAddRight}
            className="h-8 w-8 shrink-0 cursor-pointer self-start rounded-full text-sm font-semibold text-white shadow-sm"
            style={{ backgroundColor: accentColor }}
          >
            <FontAwesomeIcon icon={faPlus} />
          </button>
        ) : null}
      </div>
    </div>
  );
}
