import { useCallback, useEffect, useRef, useState } from "react";
import { MdChevronLeft, MdChevronRight } from "react-icons/md";

// A horizontally scrolling row of chips, used for team and game selection.
// Fades and arrow buttons show when there's more to scroll to.
// items: [{ key, label, className? }]
export default function ChipNav({ items, activeKey, onSelect, size = "md", children }) {
    const ref = useRef(null);
    const [overflow, setOverflow] = useState({ left: false, right: false });

    const measure = useCallback(() => {
        const el = ref.current;
        if (!el) return;
        const left = el.scrollLeft > 1;
        const right = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
        setOverflow((prev) => (prev.left === left && prev.right === right ? prev : { left, right }));
    }, []);

    useEffect(() => {
        const el = ref.current;
        el.addEventListener("scroll", measure, { passive: true });
        const observer = new ResizeObserver(measure);
        observer.observe(el);
        return () => {
            el.removeEventListener("scroll", measure);
            observer.disconnect();
        };
    }, [measure]);

    useEffect(() => {
        ref.current
            ?.querySelector(".chip.active")
            ?.scrollIntoView({ block: "nearest", inline: "nearest" });
        measure();
    }, [activeKey, items.length, measure]);

    const scroll = (direction) =>
        ref.current.scrollBy({ left: direction * ref.current.clientWidth * 0.75, behavior: "smooth" });

    let wrapClass = "chip-nav-wrap";
    if (overflow.left) wrapClass += " can-scroll-left";
    if (overflow.right) wrapClass += " can-scroll-right";

    return (
        <div className={wrapClass}>
            <button type="button" className="chip-scroll chip-scroll-left" tabIndex={-1} aria-label="Scroll left"
                    onClick={() => scroll(-1)}>
                <MdChevronLeft size={22} />
            </button>
            <div className={`chip-nav chip-nav-${size}`} role="tablist" ref={ref}>
                {items.map((item) => (
                    <button
                        key={item.key}
                        type="button"
                        role="tab"
                        aria-selected={item.key === activeKey}
                        className={"chip" + (item.key === activeKey ? " active" : "") + (item.className ? " " + item.className : "")}
                        onClick={() => onSelect(item.key)}
                    >
                        {item.label}
                    </button>
                ))}
                {children}
            </div>
            <button type="button" className="chip-scroll chip-scroll-right" tabIndex={-1} aria-label="Scroll right"
                    onClick={() => scroll(1)}>
                <MdChevronRight size={22} />
            </button>
        </div>
    );
}
