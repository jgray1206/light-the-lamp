import { useEffect, useState } from "react";
import Button from "react-bootstrap/Button";
import { MdRefresh } from "react-icons/md";

// Refreshes are often quicker than the eye, so spin for at least this long after a tap
const MIN_SPIN_MS = 600;

export default function RefreshButton({ onClick, refreshing }) {
    const [spinUntil, setSpinUntil] = useState(0);
    const [, rerender] = useState(0);

    useEffect(() => {
        const remaining = spinUntil - Date.now();
        if (remaining <= 0) return;
        const timer = setTimeout(() => rerender((n) => n + 1), remaining);
        return () => clearTimeout(timer);
    }, [spinUntil]);

    const spinning = refreshing || Date.now() < spinUntil;

    return (
        <Button variant="outline-secondary" size="sm" className="ms-auto d-inline-flex align-items-center gap-1"
                disabled={spinning} aria-label="Refresh"
                onClick={() => {
                    setSpinUntil(Date.now() + MIN_SPIN_MS);
                    onClick();
                }}>
            <MdRefresh size={18} className={spinning ? "spin" : undefined} />
            <span className="d-none d-sm-inline">{spinning ? "Refreshing" : "Refresh"}</span>
        </Button>
    );
}
