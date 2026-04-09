"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { calculatePointsForEvent } from "@/lib/calculatePoints"

type Event = {
  id: string
  name: string
  starts_at: string
  logo_url: string | null
  image_url: string | null
  is_big_event: boolean | null
  is_ple: boolean | null
  is_open: boolean
  is_ready: boolean
}

type Match = {
  id: string
  event_id: string
  match_type: string | null
  match_image_url: string | null
  display_order: number
}

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [events, setEvents] = useState<Event[]>([])
  const [selectedEventId, setSelectedEventId] = useState("")
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [matches, setMatches] = useState<Match[]>([])

  const [eventForm, setEventForm] = useState({
    name: "",
    starts_at: "",
    logo_url: "",
    image_url: "",
    is_big_event: false,
    is_ple: false,
    is_open: false,
    is_ready: false,
  })

  const [matchForm, setMatchForm] = useState({
    match_type: "",
    match_image_url: "",
  })

  const [editingMatchId, setEditingMatchId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    match_type: "",
    match_image_url: "",
  })

  async function fetchEvents() {
    const { data } = await supabase
      .from("events")
      .select("*")
      .order("starts_at", { ascending: false })

    setEvents((data as Event[]) || [])
  }

  async function fetchMatches(eventId: string) {
    const { data } = await supabase
      .from("matches")
      .select("*")
      .eq("event_id", eventId)
      .order("display_order", { ascending: true })

    setMatches((data as Match[]) || [])
  }

  useEffect(() => {
    const init = async () => {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) return

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userData.user.id)
        .single()

      if (profile?.role !== "admin") return

      setIsAdmin(true)
      await fetchEvents()
    }

    void init()
  }, [])

  const handleSelectEvent = async (eventId: string) => {
    setSelectedEventId(eventId)

    const event = events.find((item) => item.id === eventId)
    if (!event) return

    setSelectedEvent(event)
    await fetchMatches(event.id)
  }

  const createEvent = async () => {
    if (!eventForm.name || !eventForm.starts_at) {
      alert("Nom + date obligatoires")
      return
    }

    const { data, error } = await supabase
      .from("events")
      .insert([eventForm])
      .select()

    if (error) {
      alert(error.message)
      return
    }

    const newEvent = data?.[0] as Event | undefined

    if (newEvent) {
      setEvents((prev) => [newEvent, ...prev])
      setSelectedEventId(newEvent.id)
      setSelectedEvent(newEvent)
      await fetchMatches(newEvent.id)
    }

    setEventForm({
      name: "",
      starts_at: "",
      logo_url: "",
      image_url: "",
      is_big_event: false,
      is_ple: false,
      is_open: false,
      is_ready: false,
    })
  }

  const updateEventStatus = async (updates: Partial<Event>) => {
    if (!selectedEvent) return

    await supabase.from("events").update(updates).eq("id", selectedEvent.id)

    const updatedEvent = { ...selectedEvent, ...updates }
    setSelectedEvent(updatedEvent)
    setEvents((prev) =>
      prev.map((event) => (event.id === updatedEvent.id ? updatedEvent : event))
    )
  }

  const createMatch = async () => {
    if (!selectedEvent || !matchForm.match_type) return

    const nextOrder = matches.length + 1

    await supabase.from("matches").insert([
      {
        event_id: selectedEvent.id,
        match_type: matchForm.match_type,
        match_image_url: matchForm.match_image_url || null,
        display_order: nextOrder,
      },
    ])

    setMatchForm({ match_type: "", match_image_url: "" })
    await fetchMatches(selectedEvent.id)
  }

  const deleteMatch = async (id: string) => {
    await supabase.from("matches").delete().eq("id", id)
    if (selectedEvent) {
      await fetchMatches(selectedEvent.id)
    }
  }

  const startEditMatch = (match: Match) => {
    setEditingMatchId(match.id)
    setEditForm({
      match_type: match.match_type || "",
      match_image_url: match.match_image_url || "",
    })
  }

  const saveEditMatch = async (id: string) => {
    await supabase.from("matches").update(editForm).eq("id", id)
    setEditingMatchId(null)

    if (selectedEvent) {
      await fetchMatches(selectedEvent.id)
    }
  }

  const moveMatch = async (index: number, direction: "up" | "down") => {
    if (!selectedEvent) return
    if (direction === "up" && index === 0) return
    if (direction === "down" && index === matches.length - 1) return

    const targetIndex = direction === "up" ? index - 1 : index + 1
    const currentMatch = matches[index]
    const targetMatch = matches[targetIndex]

    await supabase
      .from("matches")
      .update({
        display_order: targetMatch.display_order,
      })
      .eq("id", currentMatch.id)

    await supabase
      .from("matches")
      .update({
        display_order: currentMatch.display_order,
      })
      .eq("id", targetMatch.id)

    await fetchMatches(selectedEvent.id)
  }

  const handleCalculatePoints = async () => {
    if (!selectedEvent) return

    try {
      await calculatePointsForEvent(selectedEvent.id)
      alert("Points et titres mis a jour")
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erreur pendant le calcul"

      alert(message)
    }
  }

  if (!isAdmin) {
    return <p className="text-white p-10">Acces admin uniquement</p>
  }

  return (
    <div className="max-w-6xl mx-auto mt-10 text-white space-y-10">
      <h1 className="text-3xl font-bold">Admin Panel</h1>

      <div className="bg-neutral-900 p-6 rounded-2xl border border-neutral-800 space-y-3">
        <h2 className="font-bold">Creer un evenement</h2>

        <input
          className="input"
          placeholder="Nom"
          value={eventForm.name}
          onChange={(e) =>
            setEventForm({ ...eventForm, name: e.target.value })
          }
        />

        <input
          className="input"
          type="datetime-local"
          value={eventForm.starts_at}
          onChange={(e) =>
            setEventForm({ ...eventForm, starts_at: e.target.value })
          }
        />

        <input
          className="input"
          placeholder="Logo URL"
          value={eventForm.logo_url}
          onChange={(e) =>
            setEventForm({ ...eventForm, logo_url: e.target.value })
          }
        />

        {eventForm.logo_url && (
          <img
            src={eventForm.logo_url}
            alt="Logo event"
            className="h-20 object-contain rounded border"
          />
        )}

        <input
          className="input"
          placeholder="Image fond"
          value={eventForm.image_url}
          onChange={(e) =>
            setEventForm({ ...eventForm, image_url: e.target.value })
          }
        />

        {eventForm.image_url && (
          <img
            src={eventForm.image_url}
            alt="Fond event"
            className="h-32 object-cover rounded border"
          />
        )}

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={eventForm.is_ple}
            onChange={(e) =>
              setEventForm({
                ...eventForm,
                is_ple: e.target.checked,
                is_big_event: e.target.checked,
              })
            }
          />
          Event PLE
        </label>

        <button onClick={createEvent} className="btn">
          Creer cet evenement
        </button>
      </div>

      <div>
        <h2 className="font-bold mb-2">Selectionner un evenement</h2>
        <select
          className="input"
          value={selectedEventId}
          onChange={(e) => void handleSelectEvent(e.target.value)}
        >
          <option value="">-- Choisir un event --</option>
          {events.map((event) => (
            <option key={event.id} value={event.id}>
              {event.name}
            </option>
          ))}
        </select>
      </div>

      {selectedEvent && (
        <div className="bg-neutral-900 p-6 rounded-2xl border border-neutral-800 space-y-4">
          <h2 className="font-bold">Statut</h2>

          <div>
            {selectedEvent.is_ready === false && (
              <span className="px-3 py-1 rounded-full bg-orange-600 text-sm">
                En construction
              </span>
            )}

            {selectedEvent.is_ready === true && selectedEvent.is_open === true && (
              <span className="px-3 py-1 rounded-full bg-green-600 text-sm">
                Ouvert
              </span>
            )}

            {selectedEvent.is_ready === true &&
              selectedEvent.is_open === false && (
                <span className="px-3 py-1 rounded-full bg-red-600 text-sm">
                  Ferme
                </span>
              )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => void updateEventStatus({ is_ready: false })}
              className={`px-4 py-2 rounded-lg cursor-pointer transition ${
                selectedEvent.is_ready === false
                  ? "bg-orange-700 ring-2 ring-orange-400"
                  : "bg-orange-600 hover:bg-orange-700"
              }`}
            >
              En construction
            </button>

            <button
              onClick={() =>
                void updateEventStatus({ is_ready: true, is_open: true })
              }
              className={`px-4 py-2 rounded-lg cursor-pointer transition ${
                selectedEvent.is_ready === true && selectedEvent.is_open === true
                  ? "bg-green-700 ring-2 ring-green-400"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              Ouvrir
            </button>

            <button
              onClick={() =>
                void updateEventStatus({ is_ready: true, is_open: false })
              }
              className={`px-4 py-2 rounded-lg cursor-pointer transition ${
                selectedEvent.is_ready === true &&
                selectedEvent.is_open === false
                  ? "bg-red-700 ring-2 ring-red-400"
                  : "bg-red-600 hover:bg-red-700"
              }`}
            >
              Fermer
            </button>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={selectedEvent.is_ple ?? false}
              onChange={(e) =>
                void updateEventStatus({
                  is_ple: e.target.checked,
                  is_big_event: e.target.checked,
                })
              }
            />
            Compter cet event comme un PLE
          </label>

          <button
            onClick={handleCalculatePoints}
            className="bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded"
          >
            Calculer points et titres
          </button>
        </div>
      )}

      {selectedEvent && (
        <div className="bg-neutral-900 p-6 rounded-2xl border border-neutral-800 space-y-4">
          <h2 className="font-bold">Gestion des matchs</h2>

          <input
            className="input"
            placeholder="Type de match"
            value={matchForm.match_type}
            onChange={(e) =>
              setMatchForm({ ...matchForm, match_type: e.target.value })
            }
          />

          <input
            className="input"
            placeholder="Image URL"
            value={matchForm.match_image_url}
            onChange={(e) =>
              setMatchForm({ ...matchForm, match_image_url: e.target.value })
            }
          />

          {matchForm.match_image_url && (
            <img
              src={matchForm.match_image_url}
              alt="Preview match"
              className="h-32 object-cover rounded border"
            />
          )}

          <button onClick={createMatch} className="btn">
            Ajouter le match
          </button>

          <ul className="space-y-2 mt-4">
            {matches.map((match, index) => (
              <li key={match.id} className="bg-neutral-800 p-3 rounded-lg">
                {editingMatchId === match.id ? (
                  <>
                    <input
                      className="input mb-2"
                      value={editForm.match_type}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          match_type: e.target.value,
                        })
                      }
                    />

                    <input
                      className="input mb-2"
                      value={editForm.match_image_url}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          match_image_url: e.target.value,
                        })
                      }
                    />

                    {editForm.match_image_url && (
                      <img
                        src={editForm.match_image_url}
                        alt="Preview match edition"
                        className="h-32 object-cover rounded border mb-2"
                      />
                    )}

                    <button
                      onClick={() => void saveEditMatch(match.id)}
                      className="btn mr-2"
                    >
                      Sauvegarder
                    </button>

                    <button
                      onClick={() => setEditingMatchId(null)}
                      className="btn-secondary"
                    >
                      Annuler
                    </button>
                  </>
                ) : (
                  <div className="flex justify-between items-center">
                    <span>{match.match_type}</span>
                    <div className="flex gap-3 items-center">
                      <button
                        onClick={() => void moveMatch(index, "up")}
                        disabled={index === 0}
                      >
                        Haut
                      </button>

                      <button
                        onClick={() => void moveMatch(index, "down")}
                        disabled={index === matches.length - 1}
                      >
                        Bas
                      </button>

                      <button onClick={() => startEditMatch(match)}>Editer</button>
                      <button onClick={() => void deleteMatch(match.id)}>
                        Supprimer
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
