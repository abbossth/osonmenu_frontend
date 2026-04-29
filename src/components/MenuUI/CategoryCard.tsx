"use client";

import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowDown, faArrowUp, faPen, faTrashCan } from "@fortawesome/free-solid-svg-icons";

type CategoryCardProps = {
  id: string;
  name: string;
  imageUrl?: string;
  active: boolean;
  accentColor?: string;
  isAdmin?: boolean;
  onMoveUp?: (id: string) => void;
  onMoveDown?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onAddUnder?: (id: string) => void;
  onClick: (id: string) => void;
};

export function CategoryCard({
  id,
  name,
  imageUrl,
  active,
  accentColor = "#ff4048",
  isAdmin = false,
  onMoveUp,
  onMoveDown,
  onEdit,
  onDelete,
  onAddUnder,
  onClick,
}: CategoryCardProps) {
  return (
    <div className="space-y-2">
      <motion.div
        role="button"
        tabIndex={0}
        onClick={() => onClick(id)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onClick(id);
          }
        }}
        whileTap={{ scale: 0.98 }}
        whileHover={{ scale: 1.01 }}
        className={`relative w-full overflow-hidden rounded-2xl border text-left transition ${
          active ? "shadow-[0_0_0_2px_rgba(255,64,72,0.28)]" : "border-white/10"
        }`}
        style={active ? { borderColor: accentColor } : undefined}
      >
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={name} className="h-40 w-full object-cover" />
        ) : (
          <div className="h-40 w-full bg-neutral-800" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute inset-0 grid place-items-center px-4">
          <p className="text-center text-2xl font-semibold tracking-wide text-white">{name}</p>
        </div>
        {isAdmin ? (
          <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full border border-white/20 bg-black/70 px-2 py-1 text-xs text-white backdrop-blur">
            <button type="button" onClick={(event) => { event.stopPropagation(); onMoveUp?.(id); }}>
              <FontAwesomeIcon icon={faArrowUp} />
            </button>
            <button type="button" onClick={(event) => { event.stopPropagation(); onMoveDown?.(id); }}>
              <FontAwesomeIcon icon={faArrowDown} />
            </button>
            <button type="button" onClick={(event) => { event.stopPropagation(); onEdit?.(id); }}>
              <FontAwesomeIcon icon={faPen} />
            </button>
            <button type="button" onClick={(event) => { event.stopPropagation(); onDelete?.(id); }}>
              <FontAwesomeIcon icon={faTrashCan} />
            </button>
          </div>
        ) : null}
      </motion.div>
      {isAdmin ? (
        <button
          type="button"
          onClick={() => onAddUnder?.(id)}
          className="inline-flex w-full items-center justify-center rounded-full py-1 text-2xl text-white transition brightness-95 hover:brightness-105"
          style={{ backgroundColor: accentColor }}
        >
          +
        </button>
      ) : null}
    </div>
  );
}
