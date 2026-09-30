import { useEffect, useRef } from "react";

// A horizontally scrolling row of chips, used for team and game selection.
// items: [{ key, label, className? }]
export default function ChipNav({ items, activeKey, onSelect, size = "md", children }) {
    const ref = useRef(null);

    useEffect(() => {
        ref.current
            ?.querySelector(".chip.active")
            ?.scrollIntoView({ block: "nearest", inline: "nearest" });
    }, [activeKey]);

    return (
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
    );
}
