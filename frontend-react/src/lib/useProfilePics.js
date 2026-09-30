import { useEffect, useState } from "react";
import { getProfilePic, peekProfilePic } from "./api";

const cachedPics = (ids) =>
    new Map(ids.map((id) => [id, peekProfilePic(id)]).filter(([, src]) => src !== undefined));

// Profile pics for the given user ids, fetched in parallel (and cached). Returns Map<id, src>.
export default function useProfilePics(ids) {
    const idsKey = [...new Set(ids)].sort().join(",");
    // Start with any pics already loaded this session so they show without flashing
    const [pics, setPics] = useState(() => cachedPics(idsKey ? idsKey.split(",").map(Number) : []));

    useEffect(() => {
        let cancelled = false;
        const unique = idsKey ? idsKey.split(",").map(Number) : [];
        Promise.all(unique.map(async (id) => [id, await getProfilePic(id)]))
            .then((entries) => !cancelled && setPics(new Map(entries)));
        return () => { cancelled = true; };
    }, [idsKey]);

    return pics;
}
