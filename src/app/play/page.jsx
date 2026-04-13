"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Brain, CheckCircle2, Gamepad2, Loader2, Trophy } from "lucide-react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/shared/Navbar";
import { hasEmailLoginPassword } from "@/lib/auth";
import { formatDisconnectCountdown, isDisconnectPending } from "@/lib/disconnect";
import { getFriendlyErrorMessage } from "@/lib/errors";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";

function getAnswerFor(answers, userId, questionIndex) {
  return answers.find((answer) => answer.user_id === userId && answer.question_index === questionIndex);
}

function getQuestionAnswerCount(answers, questionIndex) {
  return new Set(
    answers
      .filter((answer) => answer.question_index === questionIndex)
      .map((answer) => answer.user_id)
  ).size;
}

function getScore(answers, userId) {
  return answers.filter((answer) => answer.user_id === userId && answer.is_correct).length;
}

export default function PlayPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [partnerProfile, setPartnerProfile] = useState(null);
  const [couple, setCouple] = useState(null);
  const [room, setRoom] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [answering, setAnswering] = useState(false);

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

    const { data: coupleData, error: coupleError } = await supabase
      .from("couples")
      .select("*")
      .eq("id", profileData.couple_id)
      .maybeSingle();

    if (coupleError) {
      console.error("Quiz couple load error:", coupleError.message);
    } else {
      setCouple(coupleData);
    }

    const { data: partnerData, error: partnerError } = await supabase
      .from("profiles")
      .select("id, name, email")
      .eq("couple_id", profileData.couple_id)
      .neq("id", user.id)
      .maybeSingle();

    if (partnerError) {
      console.error("Quiz partner load error:", partnerError.message);
    } else {
      setPartnerProfile(partnerData || null);
    }

    const { data: roomData, error: roomError } = await supabase
      .from("quiz_rooms")
      .select("*")
      .eq("couple_id", profileData.couple_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

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

      if (answersError) {
        toast.error(getFriendlyErrorMessage(answersError));
      } else {
        setAnswers(answersData || []);
      }
    }

    if (!quiet) setLoading(false);
  }, [router]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!room?.id || room.status !== "active") return;

    const intervalId = window.setInterval(() => {
      loadData({ quiet: true });
    }, 3000);

    return () => window.clearInterval(intervalId);
  }, [loadData, room?.id, room?.status]);

  const questions = Array.isArray(room?.questions) ? room.questions : [];
  const disconnectPending = isDisconnectPending(couple);
  const hasPartner = Boolean(partnerProfile);
  const partnerName = partnerProfile?.name || "Your partner";
  const myScore = getScore(answers, user?.id);
  const partnerScore = getScore(answers, partnerProfile?.id);
  const currentIndex = questions.findIndex((_, index) => getQuestionAnswerCount(answers, index) < 2);
  const isFinished = Boolean(room && (room.status === "finished" || (questions.length > 0 && currentIndex === -1)));
  const activeIndex = currentIndex === -1 ? Math.max(questions.length - 1, 0) : currentIndex;
  const currentQuestion = questions[activeIndex];
  const myCurrentAnswer = getAnswerFor(answers, user?.id, activeIndex);
  const partnerCurrentAnswer = getAnswerFor(answers, partnerProfile?.id, activeIndex);
  const canStartQuiz = Boolean(profile?.couple_id && hasPartner && !disconnectPending && !starting);
  const canAnswer = Boolean(room?.status === "active" && currentQuestion && !myCurrentAnswer && !answering && !disconnectPending);

  const handleStartQuiz = async () => {
    if (!profile?.couple_id) {
      toast.error("Connect with your partner first");
      router.push("/connect");
      return;
    }

    if (!hasPartner) {
      toast.error("Your partner has not joined yet");
      return;
    }

    if (disconnectPending) {
      toast.error("Your shared world is paused while disconnect is scheduled.");
      return;
    }

    setStarting(true);

    const response = await fetch("/api/quiz/questions");
    const payload = await response.json();

    if (!response.ok || !payload.questions) {
      setStarting(false);
      toast.error(payload.error || "Quiz questions are not available right now.");
      return;
    }

    const { error } = await supabase.rpc("start_quiz_battle", {
      questions: payload.questions,
    });

    setStarting(false);

    if (error) {
      toast.error(getFriendlyErrorMessage(error));
      return;
    }

    toast.success("Quiz battle started");
    await loadData();
  };

  const handleAnswer = async (answer) => {
    if (!canAnswer) return;

    setAnswering(true);

    const { error } = await supabase.rpc("answer_quiz_question", {
      room_id: room.id,
      question_index: activeIndex,
      selected_answer: answer,
    });

    setAnswering(false);

    if (error) {
      toast.error(getFriendlyErrorMessage(error));
      return;
    }

    await loadData({ quiet: true });
  };

  let resultCopy = "Start a quiz and see who wins.";
  if (isFinished) {
    if (myScore > partnerScore) resultCopy = "You won. A dare would be fair now.";
    else if (myScore < partnerScore) resultCopy = `${partnerName} won this round.`;
    else resultCopy = "Same brain energy. It is a draw.";
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--app-bg-soft)] px-4">
        <p className="text-sm font-medium text-[var(--muted)]">Loading...</p>
      </main>
    );
  }

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
                  Quiz Battle
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/85">
                  20 random questions. Both answer the same question. Correct answers add one point.
                </p>
              </div>
              <button
                type="button"
                onClick={handleStartQuiz}
                disabled={!canStartQuiz}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[var(--accent)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {starting ? <Loader2 className="animate-spin" size={18} /> : <Gamepad2 size={18} />}
                {starting ? "Starting..." : "Start new battle"}
              </button>
            </div>
          </div>
        </section>

        {disconnectPending && (
          <div className="mt-6 rounded-2xl border border-[var(--danger-border)] bg-[var(--danger-soft)] p-4 text-sm text-[var(--danger)]">
            Your shared world is paused. You can cancel disconnect within {formatDisconnectCountdown(couple?.disconnect_delete_after)} from Profile.
          </div>
        )}

        {!profile?.couple_id && (
          <div className="mt-6 rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow)]">
            <h2 className="text-xl font-semibold text-[var(--text)]">Connect first</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              Quiz Battle needs a shared partner space.
            </p>
            <Link
              href="/connect"
              className="mt-4 inline-flex rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-[var(--accent-contrast)] transition hover:opacity-90"
            >
              Go to connect
            </Link>
          </div>
        )}

        {profile?.couple_id && !hasPartner && (
          <div className="mt-6 rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow)]">
            <h2 className="text-xl font-semibold text-[var(--text)]">Waiting for your partner</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              Share your invite first. Quiz Battle unlocks when your partner joins.
            </p>
          </div>
        )}

        {profile?.couple_id && hasPartner && (
          <section className="mt-6 grid gap-6 lg:grid-cols-[0.72fr_1.28fr]">
            <aside className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow)]">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
                Scoreboard
              </p>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-[var(--surface-soft)] p-4">
                  <p className="text-sm font-semibold text-[var(--text)]">You</p>
                  <p className="mt-2 text-4xl font-semibold text-[var(--accent)]">{myScore}</p>
                </div>
                <div className="rounded-2xl bg-[var(--surface-soft)] p-4">
                  <p className="truncate text-sm font-semibold text-[var(--text)]">{partnerName}</p>
                  <p className="mt-2 text-4xl font-semibold text-[var(--accent)]">{partnerScore}</p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4">
                <div className="flex items-start gap-3">
                  <Trophy className="mt-1 text-[var(--accent)]" size={22} />
                  <div>
                    <p className="text-sm font-semibold text-[var(--text)]">Result</p>
                    <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{resultCopy}</p>
                  </div>
                </div>
                {isFinished && myScore > partnerScore && (
                  <Link
                    href="/dares"
                    className="mt-4 inline-flex w-full justify-center rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-[var(--accent-contrast)] transition hover:opacity-90"
                  >
                    Send a dare
                  </Link>
                )}
              </div>
            </aside>

            <section className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow)]">
              {!room ? (
                <div className="flex min-h-80 flex-col items-center justify-center text-center">
                  <Brain className="text-[var(--accent)]" size={42} />
                  <h2 className="mt-4 text-2xl font-semibold text-[var(--text)]">
                    No quiz yet
                  </h2>
                  <p className="mt-2 max-w-md text-sm leading-6 text-[var(--muted)]">
                    Start a new battle. Your partner will see the same questions when they open this page.
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
                <div>
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
                      const revealAnswer = Boolean(myCurrentAnswer);
                      const isCorrect = currentQuestion.correctAnswer === answer;

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

                  {myCurrentAnswer && !partnerCurrentAnswer && (
                    <p className="mt-5 rounded-2xl bg-[var(--surface-soft)] p-4 text-center text-sm font-medium text-[var(--muted)]">
                      Your answer is locked. Waiting for {partnerName}.
                    </p>
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
