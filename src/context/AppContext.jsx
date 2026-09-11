import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api } from "../api/client.js";
import { enrichPlaces, CATEGORIES } from "../data/places";

const STORE_ITINERARY = "daytripper.itinerary";
const STORE_FAVORITES = "daytripper.favorites";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [itinerary, setItinerary] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem(STORE_ITINERARY) || "[]");
    } catch {
      return [];
    }
  });
  const [startTime, setStartTime] = useState("08:00");
  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORE_FAVORITES) || "[]");
    } catch {
      return [];
    }
  });

  const [places, setPlaces] = useState([]);
  const [adminPlaces, setAdminPlaces] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [catList, setCatList] = useState([...CATEGORIES]);

  const byId = (id) => places.find((p) => p.id === id);

  const refreshPlaces = async () => {
    try {
      const list = await api.listPlaces();
      setPlaces(enrichPlaces(list));
      setError("");
    } catch (err) {
      setError("Could not load the catalogue. Is the API running?");
    }
  };

  const refreshAdminPlaces = async () => {
    try {
      const list = await api.adminPlaces();
      setAdminPlaces(enrichPlaces(list));
    } catch (err) {
      /* not logged in — fine */
    }
  };

  // ---- boot: session + catalogue ----
  useEffect(() => {
    (async () => {
      try {
        const session = await api.getSession();
        if (session.user) {
          setIsAdmin(true);
          await refreshAdminPlaces();
        }
      } catch {
        /* ignore */
      }
      await refreshPlaces();
      setLoading(false);

      try {
        const list = await api.getCategoryList();
        if (Array.isArray(list) && list.length) {
          setCatList(list.map((c) => c.name));
        }
      } catch {
        /* keep defaults */
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    sessionStorage.setItem(STORE_ITINERARY, JSON.stringify(itinerary));
  }, [itinerary]);

  useEffect(() => {
    localStorage.setItem(STORE_FAVORITES, JSON.stringify(favorites));
  }, [favorites]);

  const addToPlan = (id, duration) => {
    if (itinerary.some((it) => it.placeId === id)) return false;
    const place = byId(id);
    if (!place) return false;
    setItinerary((prev) => [
      ...prev,
      {
        placeId: id,
        durationMin: duration || place.visitDurationMin,
        sequence: prev.length + 1,
      },
    ]);
    return true;
  };

  const removeFromPlan = (id) => {
    setItinerary((prev) =>
      prev
        .filter((it) => it.placeId !== id)
        .map((it, i) => ({ ...it, sequence: i + 1 }))
    );
  };

  const clearPlan = () => setItinerary([]);

  const moveItem = (index, dir) => {
    setItinerary((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next.map((it, i) => ({ ...it, sequence: i + 1 }));
    });
  };

  const setDuration = (id, durationMin) => {
    setItinerary((prev) =>
      prev.map((it) =>
        it.placeId === id ? { ...it, durationMin: Number(durationMin) } : it
      )
    );
  };

  const toggleFavorite = (id) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  const isFavorite = (id) => favorites.includes(id);

  const addAllFavorites = () => {
    let added = 0;
    favorites.forEach((id) => {
      if (addToPlan(id)) added += 1;
    });
    return added;
  };

  const recommendedOrder = (ids) => {
    const sorted = [...ids].sort((a, b) => {
      const pa = byId(a);
      const pb = byId(b);
      return (pa?.distanceKm || 0) - (pb?.distanceKm || 0);
    });
    return sorted;
  };

  const travelMinutes = (fromKm, toKm) => {
    const avgKmPerMin = 0.5;
    return Math.max(
      10,
      Math.round(Math.abs((toKm || 0) - (fromKm || 0)) / avgKmPerMin)
    );
  };

  const applyRecommendedOrder = () => {
    setItinerary((prev) => {
      const ordered = recommendedOrder(prev.map((it) => it.placeId));
      return prev
        .map((it) => {
          const idx = ordered.indexOf(it.placeId);
          return { ...it, sequence: idx + 1 };
        })
        .sort((a, b) => a.sequence - b.sequence);
    });
  };

  // ---- Auth ----
  const login = async (username, password) => {
    try {
      await api.login(username, password);
      setIsAdmin(true);
      await refreshAdminPlaces();
      await refreshPlaces();
      return { ok: true };
    } catch (err) {
      return { ok: false, message: err.message };
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      /* ignore */
    }
    setIsAdmin(false);
    setAdminPlaces([]);
    await refreshPlaces();
  };

  // ---- Admin CRUD (persisted on the server) ----
  const createPlace = async (data) => {
    const res = await api.createPlace(data);
    await refreshAdminPlaces();
    await refreshPlaces();
    return res.place;
  };

  const updatePlace = async (id, data) => {
    const res = await api.updatePlace(id, data);
    await refreshAdminPlaces();
    await refreshPlaces();
    return res.place;
  };

  const patchPlace = async (id, data) => {
    const res = await api.patchPlace(id, data);
    await refreshAdminPlaces();
    await refreshPlaces();
    return res.place;
  };

  const softDeletePlace = async (id) => {
    await api.softDeletePlace(id);
    await refreshAdminPlaces();
    await refreshPlaces();
  };

  const restorePlace = async (id) => {
    await api.restorePlace(id);
    await refreshAdminPlaces();
    await refreshPlaces();
  };

  const bulkUpdate = async (ids, patch) => {
    const res = await api.bulkUpdate(ids, patch);
    await refreshAdminPlaces();
    await refreshPlaces();
    return res;
  };

  // ---- Categories ----
  const addCategory = async (name) => {
    await api.createCategory(name);
    const list = await api.getCategoryList();
    setCatList(list.map((c) => c.name));
  };

  const removeCategory = async (name) => {
    const list = await api.getCategoryList();
    const cat = list.find((c) => c.name === name);
    if (cat) {
      await api.deleteCategory(cat.id);
    }
    const next = await api.getCategoryList();
    setCatList(next.map((c) => c.name));
  };

  const value = useMemo(
    () => ({
      places,
      setPlaces,
      adminPlaces,
      setAdminPlaces,
      refreshPlaces,
      refreshAdminPlaces,
      catList,
      addCategory,
      removeCategory,
      loading,
      loadingError: error,
      createPlace,
      updatePlace,
      patchPlace,
      softDeletePlace,
      restorePlace,
      bulkUpdate,
      itinerary,
      startTime,
      setStartTime,
      addToPlan,
      removeFromPlan,
      clearPlan,
      moveItem,
      setDuration,
      favorites,
      toggleFavorite,
      isFavorite,
      addAllFavorites,
      recommendedOrder,
      applyRecommendedOrder,
      travelMinutes,
      isAdmin,
      login,
      logout,
    }),
    [
      places,
adminPlaces,
      catList,
      addCategory,
      removeCategory,
      loading,
      error,
      itinerary,
      startTime,
      favorites,
      isAdmin,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  return useContext(AppContext);
}