"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Brain, CheckCircle2, ClipboardCopy, Gamepad2, Loader2, Play, Trophy } from "lucide-react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/shared/Navbar";
import PageSkeleton from "@/components/shared/PageSkeleton";
import { hasEmailLoginPassword } from "@/lib/auth";
import { formatDisconnectCountdown, isDisconnectPending } from "@/lib/disconnect";
import { getFriendlyErrorMessage } from "@/lib/errors";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";

function getScore(answers, userId) {
  return answers.filter((answer) => answer.user_id === userId && answer.is_correct).length;
}

function getAnsweredCount(answers, userId) {
  return answers.filter((answer) => answer.user_id === userId).length;
}

function getAnswerFor(answers, userId, questionIndex) {
  return answers.find((answer) => answer.user_id === userId && answer.question_index === questionIndex);
}

function formatTimeLeft(endsAt) {
  if (!endsAt) return "8:00";
  const secondsLeft = Math.max(0, Math.ceil((new Date(endsAt).getTime() - Date.now()) / 1000));
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export default function PlayPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [partnerProfile, setPartnerProfile] = useState(null);
  const [couple, setCouple] = useState(null);
  const [room, setRoom] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [joinCode, setJoinCode] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState("8:00");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const loadData = useCallback(async ({ quiet = false } = {}) => {
    if (!quiet) setLoading(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      router.push("/login");
      return;
    }

    if (!hasEmailLoginPassword(user)) {
      router.push("/auth/setup-password");
      return;
    }

    setUser(user);

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("id, name, email, couple_id")
      .eq("id", user.id)
      .single();

    if (profileError || !profileData) {
      toast.error("Profile load failed");
      if (!quiet) setLoading(false);
      return;
    }

    setProfile(profileData);
    setPartnerProfile(null);
    setCouple(null);
    setRoom(null);
    setAnswers([]);

    if (!profileData.couple_id) {
      if (!quiet) setLoading(false);
      return;
    }

    const [
      { data: coupleData, error: coupleError },
      { data: partnerData, error: partnerError },
      { data: roomData, error: roomError },
    ] = await Promise.all([
      supabase.from("couples").select("*").eq("id", profileData.couple_id).maybeSingle(),
      supabase
        .from("profiles")
        .select("id, name, email")
        .eq("couple_id", profileData.couple_id)
        .neq("id", user.id)
        .maybeSingle(),
      supabase
        .from("quiz_rooms")
        .select("*")
        .eq("couple_id", profileData.couple_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    if (coupleError) console.error("Brain battle couple load error:", coupleError.message);
    else setCouple(coupleData);

    if (partnerError) console.error("Brain battle partner load error:", partnerError.message);
    else setPartnerProfile(partnerData || null);

    if (roomError) {
      toast.error(getFriendlyErrorMessage(roomError));
      if (!quiet) setLoading(false);
      return;
    }

    setRoom(roomData || null);

    if (roomData?.id) {
      const { data: answersData, error: answersError } = await supabase
        .from("quiz_answers")
        .select("*")
        .eq("room_id", roomData.id)
        .order("question_index", { ascending: true });

      if (answersError) toast.error(getFriendlyErrorMessage(answersError));
      else setAnswers(answersData || []);
    }

    if (!quiet) setLoading(false);
  }, [router]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!room?.id || !["waiting", "active"].includes(room.status)) return;

    const intervalId = window.setInterval(() => {
      loadData({ quiet: true });
    }, 3000);

    return () => window.clearInterval(intervalId);
  }, [loadData, room?.id, room?.status]);

  useEffect(() => {
    if (room?.status !== "active" || !room.ends_at) return;

    const tick = async () => {
      const nextTimeLeft = formatTimeLeft(room.ends_at);
      setTimeLeft(nextTimeLeft);

      if (nextTimeLeft === "0:00") {
        await supabase.rpc("finish_brain_battle", { target_room_id: room.id });
        await loadData({ quiet: true });
      }
    };

    tick();
    const intervalId = window.setInterval(tick, 1000);

    return () => window.clearInterval(intervalId);
  }, [loadData, room?.ends_at, room?.id, room?.status]);

  const questions = useMemo(
    () => (Array.isArray(room?.questions) ? room.questions : []),
    [room]
  );
  const disconnectPending = isDisconnectPending(couple);
  const hasPartner = Boolean(partnerProfile);
  const partnerName = partnerProfile?.name || "Your partner";
  const myScore = getScore(answers, user?.id);
  const partnerScore = getScore(answers, partnerProfile?.id);
  const myAnsweredCount = getAnsweredCount(answers, user?.id);
  const partnerAnsweredCount = getAnsweredCount(answers, partnerProfile?.id);
  const isRoomCreator = room?.participant_one_id === user?.id;
  const isJoined = Boolean(room?.participant_two_id);
  const isRoomPlayer = user?.id === room?.participant_one_id || user?.id === room?.participant_two_id;
  const isFinished = room?.status === "finished";
  const currentQuestion = questions[activeIndex];
  const myCurrentAnswer = getAnswerFor(answers, user?.id, activeIndex);
  const canCreateRoom = Boolean(profile?.couple_id && hasPartner && !disconnectPending && !busy);
  const canStartRoom = Boolean(room?.status === "waiting" && isJoined && isRoomPlayer && !disconnectPending && !busy);
  const canAnswer = Boolean(room?.status === "active" && currentQuestion && !myCurrentAnswer && !busy && !disconnectPending);

  const nextUnansweredIndex = useMemo(() => {
    const index = questions.findIndex((_, questionIndex) => !getAnswerFor(answers, user?.id, questionIndex));
    return index === -1 ? Math.max(questions.length - 1, 0) : index;
  }, [answers, questions, user?.id]);

  const handleCreateRoom = async () => {
    if (!canCreateRoom) return;
    setBusy(true);

    const response = await fetch("/api/quiz/questions");
    const payload = await response.json();

    if (!response.ok || !payload.questions) {
      setBusy(false);
      toast.error(payload.error || "Brain questions are not available right now.");
      return;
    }

    const { data, error } = await supabase.rpc("create_brain_battle_room", {
      questions: payload.questions,
    });

    setBusy(false);

    if (error) {
      toast.error(getFriendlyErrorMessage(error));
      return;
    }

    const roomInfo = Array.isArray(data) ? data[0] : data;
    toast.success(`Room created: ${roomInfo?.room_code || "ready"}`);
    await loadData();
  };

  const handleJoinRoom = async (event) => {
    event.preventDefault();
    const normalizedCode = joinCode.trim().toUpperCase();
    if (!normalizedCode) return;

    setBusy(true);

    const { error } = await supabase.rpc("join_brain_battle_room", {
      join_code: normalizedCode,
    });

    setBusy(false);

    if (error) {
      toast.error(getFriendlyErrorMessage(error));
      return;
    }

    setJoinCode("");
    toast.success("Joined Brain Battle");
    await loadData();
  };

  const handleJoinVisibleRoom = async () => {
    if (!room?.room_code) return;
    setJoinCode(room.room_code);
    setBusy(true);

    const { error } = await supabase.rpc("join_brain_battle_room", {
      join_code: room.room_code,
    });

    setBusy(false);

    if (error) {
      toast.error(getFriendlyErrorMessage(error));
      return;
    }

    setJoinCode("");
    toast.success("Joined Brain Battle");
    await loadData();
  };

  const handleStartRoom = async () => {
    if (!canStartRoom) return;
    setBusy(true);

    const { error } = await supabase.rpc("start_brain_battle", {
      target_room_id: room.id,
    });

    setBusy(false);

    if (error) {
      toast.error(getFriendlyErrorMessage(error));
      return;
    }

    toast.success("Brain Battle started");
    await loadData();
  };

  const handleCopyCode = async () => {
    if (!room?.room_code) return;

    try {
      await navigator.clipboard.writeText(room.room_code);
      toast.success("Room code copied");
    } catch {
      toast.error("Could not copy room code");
    }
  };

  const handleAnswer = async (answer) => {
    if (!canAnswer) return;
    setBusy(true);

    const { error } = await supabase.rpc("answer_quiz_question", {
      room_id: room.id,
      question_index: activeIndex,
      selected_answer: answer,
    });

    setBusy(false);

    if (error) {
      toast.error(getFriendlyErrorMessage(error));
      await loadData({ quiet: true });
      return;
    }

    await loadData({ quiet: true });
  };

  let resultCopy = "Create a room, share the code, then start together.";
  if (isFinished) {
    if (myScore > partnerScore) resultCopy = "You won. A dare would be fair now.";
    else if (myScore < partnerScore) resultCopy = `${partnerName} won this round.`;
    else resultCopy = "Same brain energy. It is a draw.";
  }

  if (loading) return <PageSkeleton variant="cards" />;

  return (
    <div className="min-h-screen bg-[var(--app-bg-soft)]">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <section className="overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow)]">
          <div className="bg-[linear-gradient(135deg,#7d5fbd_0%,#9d5c63_48%,#d79f72_100%)] p-7 text-white sm:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/80">
              Couple play
            </p>
            <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="text-4xl font-semibold tracking-tight">
                  Brain Battle
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/85">
                  One room code. 20 tricky questions. 8 minutes.
                </p>
              </div>
              {room?.status === "active" && (
                <div className="rounded-2xl bg-white/18 px-5 py-3 text-center backdrop-blur">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/75">
                    Time left
                  </p>
                  <p className="text-2xl font-semibold">{timeLeft}</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {disconnectPending && (
          <div className="mt-6 rounded-2xl border border-[var(--danger-border)] bg-[var(--danger-soft)] p-4 text-sm text-[var(--danger)]">
            Your shared world is paused. You can cancel disconnect within {formatDisconnectCountdown(couple?.disconnect_delete_after)} from Profile.
          </div>
        )}

        {!profile?.couple_id && (
          <InfoCard title="Connect first" copy="Brain Battle needs a shared partner space.">
            <Link href="/connect" className="mt-4 inline-flex rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-[var(--accent-contrast)] transition hover:opacity-90">
              Go to connect
            </Link>
          </InfoCard>
        )}

        {profile?.couple_id && !hasPartner && (
          <InfoCard title="Waiting for your partner" copy="Share your invite first. Brain Battle unlocks when your partner joins." />
        )}

        {profile?.couple_id && hasPartner && (
          <section className="mt-6 grid gap-6 lg:grid-cols-[0.7fr_1.3fr]">
            <aside className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow)]">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
                Room
              </p>

              {!room || isFinished ? (
                <div className="mt-5 space-y-3">
                  <button
                    type="button"
                    onClick={handleCreateRoom}
                    disabled={!canCreateRoom}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-[var(--accent-contrast)] transition hover:opacity-90 disabled:opacity-60"
                  >
                    {busy ? <Loader2 className="animate-spin" size={18} /> : <Gamepad2 size={18} />}
                    Create room
                  </button>

                  <form onSubmit={handleJoinRoom} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4">
                    <label className="text-sm font-semibold text-[var(--text)]" htmlFor="brain-room-code">
                      Join with code
                    </label>
                    <input
                      id="brain-room-code"
                      value={joinCode}
                      onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
                      placeholder="ABC123"
                      maxLength={6}
                      className="mt-3 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 font-mono text-[var(--text)] outline-none placeholder:text-[var(--muted)] focus:border-[var(--accent)]"
                    />
                    <button
                      type="submit"
                      disabled={busy || !joinCode.trim()}
                      className="mt-3 w-full rounded-xl border border-[var(--border)] px-4 py-3 text-sm font-semibold text-[var(--accent)] transition hover:bg-[var(--surface-accent)] disabled:opacity-60"
                    >
                      Join room
                    </button>
                  </form>
                </div>
              ) : (
                <div className="mt-5 space-y-4">
                  <div className="rounded-2xl bg-[var(--surface-soft)] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
                      Room code
                    </p>
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="mt-2 inline-flex w-full items-center justify-between rounded-xl bg-[var(--surface)] px-4 py-3 font-mono text-xl font-semibold text-[var(--text)]"
                    >
                      {room.room_code}
                      <ClipboardCopy size={18} className="text-[var(--accent)]" />
                    </button>
                  </div>

                  {room.status === "waiting" && (
                    <>
                      <p className="text-sm leading-6 text-[var(--muted)]">
                        {isJoined
                          ? "Both players joined. Start when you are ready."
                          : isRoomCreator
                            ? "Share the code with your partner."
                            : "Your partner created this room. Join to play."}
                      </p>
                      {isRoomCreator || isRoomPlayer ? (
                        <button
                          type="button"
                          onClick={handleStartRoom}
                          disabled={!canStartRoom}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-[var(--accent-contrast)] transition hover:opacity-90 disabled:opacity-60"
                        >
                          <Play size={17} />
                          Start 8 minute battle
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleJoinVisibleRoom}
                          disabled={busy || disconnectPending}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-[var(--accent-contrast)] transition hover:opacity-90 disabled:opacity-60"
                        >
                          Join this room
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}

              <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4">
                <div className="flex items-start gap-3">
                  <Trophy className="mt-1 text-[var(--accent)]" size={22} />
                  <div>
                    <p className="text-sm font-semibold text-[var(--text)]">Result</p>
                    <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{resultCopy}</p>
                  </div>
                </div>
                {isFinished && myScore > partnerScore && (
                  <Link href="/dares" className="mt-4 inline-flex w-full justify-center rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-[var(--accent-contrast)] transition hover:opacity-90">
                    Send a dare
                  </Link>
                )}
              </div>
            </aside>

            <section className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow)]">
              <div className="grid grid-cols-2 gap-3">
                <ScoreTile label="You" score={myScore} answered={myAnsweredCount} />
                <ScoreTile label={partnerName} score={partnerScore} answered={partnerAnsweredCount} />
              </div>

              {!room || room.status === "waiting" ? (
                <div className="flex min-h-80 flex-col items-center justify-center text-center">
                  <Brain className="text-[var(--accent)]" size={42} />
                  <h2 className="mt-4 text-2xl font-semibold text-[var(--text)]">
                    {room?.status === "waiting" ? "Room is waiting" : "No room yet"}
                  </h2>
                  <p className="mt-2 max-w-md text-sm leading-6 text-[var(--muted)]">
                    Create a room, let your partner join with the code, then start together.
                  </p>
                </div>
              ) : isFinished ? (
                <div className="flex min-h-80 flex-col items-center justify-center text-center">
                  <CheckCircle2 className="text-[var(--accent)]" size={46} />
                  <h2 className="mt-4 text-3xl font-semibold text-[var(--text)]">
                    Battle finished
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{resultCopy}</p>
                </div>
              ) : currentQuestion ? (
                <div className="mt-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="rounded-full bg-[var(--surface-accent)] px-4 py-2 text-sm font-semibold text-[var(--accent)]">
                      Question {activeIndex + 1} of {questions.length}
                    </span>
                    <span className="rounded-full bg-[var(--surface-soft)] px-4 py-2 text-sm font-semibold text-[var(--muted)]">
                      {currentQuestion.category}
                    </span>
                  </div>

                  <h2 className="mt-6 text-2xl font-semibold leading-9 text-[var(--text)]">
                    {currentQuestion.question}
                  </h2>

                  <div className="mt-6 grid gap-3">
                    {currentQuestion.answers.map((answer) => {
                      const isMyChoice = myCurrentAnswer?.selected_answer === answer;
                      const isCorrect = currentQuestion.correctAnswer === answer;
                      const revealAnswer = Boolean(myCurrentAnswer);

                      return (
                        <button
                          key={answer}
                          type="button"
                          onClick={() => handleAnswer(answer)}
                          disabled={!canAnswer}
                          className={`rounded-2xl border px-4 py-4 text-left text-sm font-semibold transition disabled:cursor-not-allowed ${revealAnswer && isCorrect
                            ? "border-[#6ca85f] bg-[#d8f2d2] text-[#365b32]"
                            : isMyChoice
                              ? "border-[var(--danger-border)] bg-[var(--danger-soft)] text-[var(--danger)]"
                              : "border-[var(--border)] bg-[var(--surface-soft)] text-[var(--text)] hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-75"
                            }`}
                        >
                          {answer}
                        </button>
                      );
                    })}
                  </div>

                  {myCurrentAnswer && myAnsweredCount < questions.length && (
                    <button
                      type="button"
                      onClick={() => setActiveIndex(nextUnansweredIndex)}
                      className="mt-5 w-full rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-[var(--accent-contrast)] transition hover:opacity-90"
                    >
                      Next unanswered
                    </button>
                  )}
                </div>
              ) : null}
            </section>
          </section>
        )}
      </main>
    </div>
  );
}

function InfoCard({ title, copy, children }) {
  return (
    <div className="mt-6 rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow)]">
      <h2 className="text-xl font-semibold text-[var(--text)]">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{copy}</p>
      {children}
    </div>
  );
}

function ScoreTile({ label, score, answered }) {
  return (
    <div className="rounded-2xl bg-[var(--surface-soft)] p-4">
      <p className="truncate text-sm font-semibold text-[var(--text)]">{label}</p>
      <p className="mt-2 text-4xl font-semibold text-[var(--accent)]">{score}</p>
      <p className="mt-1 text-xs text-[var(--muted)]">{answered}/20 answered</p>
    </div>
  );
}
