"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

type Note = {
  id: string;
  title: string;
  content: string;
  created_at: string;
};

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [notes, setNotes] = useState<Note[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) setMessage(error.message);
      setUser(data.session?.user ?? null);
      setReady(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const loadNotes = useCallback(async () => {
    const { data, error } = await supabase
      .from("notes")
      .select("id, title, content, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      return;
    }

    setNotes(data ?? []);
  }, []);

  useEffect(() => {
    if (!user) return;

    void loadNotes();
  }, [user, loadNotes]);

  async function authenticate(signUp: boolean) {
    setBusy(true);
    setMessage("");

    try {
      const result = signUp
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });

      if (result.error) {
        setMessage(result.error.message);
      } else if (signUp && !result.data.session) {
        setMessage("Account created! Check your email to confirm your account.");
      } else {
        setMessage(signUp ? "Welcome to InStudy!" : "Welcome back!");
      }
    } finally {
      setBusy(false);
    }
  }

  
async function saveNote() {
  if (!user) return;

  setBusy(true);
  setMessage("");

  try {
    const values = {
      title: title.trim() || "Untitled note",
      content,
    };

    const result = editing
      ? await supabase
          .from("notes")
          .update(values)
          .eq("id", editing)
          .eq("user_id", user.id)
      : await supabase.from("notes").insert({
          ...values,
          user_id: user.id,
        });

    if (result.error) {
      setMessage(result.error.message);
      return;
    }

    setTitle("");
    setContent("");
    setEditing(null);
    setMessage("Your note has been saved!");

    await loadNotes();
  } catch {
    setMessage("Something went wrong. Please try again.");
  } finally {
    setBusy(false);
  }
}

  function startEditing(note: Note) {
    setEditing(note.id);
    setTitle(note.title);
    setContent(note.content);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function deleteNote(id: string) {
    if (!window.confirm("Delete this note?")) return;

    const { error } = await supabase.from("notes").delete().eq("id", id);

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Note deleted.");
      await loadNotes();
    }
  }

  if (!ready) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-rose-50 text-rose-900">
        Loading InStudy...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fff9f5] text-[#443842]">
      <header className="border-b border-rose-100 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <Link href="/" className="text-2xl font-black tracking-tight">
            📚 InStudy
          </Link>
          {user && (
            <button
              onClick={async () => {
                const { error } = await supabase.auth.signOut();

                if (error) {
                  setMessage(error.message);
                  return;
                }

                setNotes([]);
                setEditing(null);
                setTitle("");
                setContent("");
              }}
              className="rounded-full border border-rose-200 px-4 py-2 text-sm hover:bg-rose-50"
            >
              Log out
            </button>
          )}
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-5 py-10">
        {!user ? (
          <div className="mx-auto max-w-md rounded-3xl border border-rose-100 bg-white p-7 shadow-sm">
            <div className="mb-6 text-center">
              <div className="text-5xl">🌸</div>
              <h1 className="mt-3 text-3xl font-black">Welcome to InStudy</h1>
              <p className="mt-2 text-sm text-gray-500">
                Your little space to learn and grow.
              </p>
            </div>

            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                void authenticate(false);
              }}
            >
              <label className="block text-sm font-medium">
                Email
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-rose-100 p-3 outline-rose-300"
                  placeholder="you@example.com"
                />
              </label>

              <label className="block text-sm font-medium">
                Password
                <input
                  required
                  minLength={6}
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-rose-100 p-3 outline-rose-300"
                  placeholder="At least 6 characters"
                />
              </label>

              <button
                disabled={busy}
                className="w-full rounded-xl bg-rose-300 p-3 font-semibold text-white hover:bg-rose-400 disabled:opacity-60"
              >
                Log in
              </button>
            </form>

            <button
              disabled={busy || !email || password.length < 6}
              onClick={() => void authenticate(true)}
              className="mt-3 w-full rounded-xl border border-rose-200 p-3 font-medium hover:bg-rose-50 disabled:opacity-60"
            >
              Create an account
            </button>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <p className="text-sm font-semibold uppercase tracking-widest text-rose-400">
                Your personal study space
              </p>
              <h1 className="mt-2 text-3xl font-black sm:text-4xl">
                Hello, learner! ✨
              </h1>
              <p className="mt-2 text-gray-500">
                Organize your thoughts, one note at a time.
              </p>
            </div>

            <section className="mb-9 rounded-3xl border border-rose-100 bg-white p-5 shadow-sm sm:p-7">
              <h2 className="mb-4 text-xl font-bold">
                {editing ? "Edit your note ✏️" : "Create a study note 📝"}
              </h2>

              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Note title"
                className="mb-3 w-full rounded-xl border border-rose-100 p-3 outline-rose-300"
              />

              <textarea
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder="Write what you want to remember..."
                rows={5}
                className="w-full rounded-xl border border-rose-100 p-3 outline-rose-300"
              />

              <div className="mt-3 flex flex-wrap gap-3">
                <button
                  disabled={busy}
                  onClick={() => void saveNote()}
                  className="rounded-xl bg-rose-300 px-5 py-3 font-semibold text-white hover:bg-rose-400 disabled:opacity-60"
                >
                  {editing ? "Save changes" : "Save note"}
                </button>

                {editing && (
                  <button
                    onClick={() => {
                      setEditing(null);
                      setTitle("");
                      setContent("");
                    }}
                    className="rounded-xl border px-5 py-3"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </section>

            <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <h2 className="text-2xl font-bold">My study notes ♡</h2>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search notes..."
                className="rounded-xl border border-rose-100 bg-white p-3 outline-rose-300 sm:max-w-xs"
              />
            </div>

            {notes.filter((note) =>
              `${note.title} ${note.content}`
                .toLowerCase()
                .includes(search.toLowerCase())
            ).length === 0 ? (
              <div className="rounded-3xl border border-dashed border-rose-200 p-10 text-center text-gray-500">
                <div className="text-4xl">🌷</div>
                <p className="mt-3">No notes yet. Create your first one!</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {notes
                  .filter((note) =>
                    `${note.title} ${note.content}`
                      .toLowerCase()
                      .includes(search.toLowerCase())
                  )
                  .map((note) => (
                    <article
                      key={note.id}
                      className="rounded-2xl border border-rose-100 bg-white p-5 shadow-sm"
                    >
                      <h3 className="break-words text-lg font-bold">
                        {note.title}
                      </h3>
                      <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-gray-600">
                        {note.content}
                      </p>
                      <p className="mt-4 text-xs text-gray-400">
                        {new Date(note.created_at).toLocaleDateString()}
                      </p>
                      <div className="mt-4 flex gap-4 text-sm">
                        <button
                          onClick={() => startEditing(note)}
                          className="font-medium text-rose-600"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => void deleteNote(note.id)}
                          className="font-medium text-red-500"
                        >
                          Delete
                        </button>
                      </div>
                    </article>
                  ))}
              </div>
            )}
          </>
        )}

        {message && (
          <p role="status" className="mt-5 rounded-xl bg-rose-50 p-3 text-sm" aria-live="polite">
            {message}
          </p>
        )}
      </section>

      <footer className="py-8 text-center text-sm text-gray-400">
        Made with ♡ by InStudy
      </footer>
    </main>
  );
}
