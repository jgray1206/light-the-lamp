import { useEffect, useState } from "react";
import { getProfilePic } from "./api";

// Fetches profile pics for the given user ids in parallel. Returns Map<id, src>.
export default function useProfilePics(ids) {
    const [pics, setPics] = useState(new Map());
    const idsKey = [...new Set(ids)].sort().join(",");

    useEffect(() => {
        let cancelled = false;
        const unique = idsKey ? idsKey.split(",") : [];
        Promise.all(unique.map(async (id) => [Number(id), await getProfilePic(id)]))
            .then((entries) => !cancelled && setPics(new Map(entries)));
        return () => { cancelled = true; };
    }, [idsKey]);

    return pics;
}
