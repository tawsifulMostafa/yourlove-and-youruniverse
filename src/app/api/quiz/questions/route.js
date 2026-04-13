export const dynamic = "force-dynamic";

function decodeHtml(value) {
  if (!value) return "";

  return value
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&eacute;/g, "e")
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"');
}

function shuffle(items) {
  const nextItems = [...items];

  for (let index = nextItems.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [nextItems[index], nextItems[swapIndex]] = [nextItems[swapIndex], nextItems[index]];
  }

  return nextItems;
}

export async function GET() {
  try {
    const response = await fetch("https://opentdb.com/api.php?amount=20&type=multiple&encode=url3986", {
      cache: "no-store",
    });

    if (!response.ok) {
      return Response.json({ error: "Quiz questions are not available right now." }, { status: 502 });
    }

    const payload = await response.json();

    if (payload.response_code !== 0 || !Array.isArray(payload.results)) {
      return Response.json({ error: "Could not load enough quiz questions." }, { status: 502 });
    }

    const questions = payload.results.slice(0, 20).map((item, index) => {
      const correctAnswer = decodeURIComponent(item.correct_answer || "");
      const incorrectAnswers = (item.incorrect_answers || []).map((answer) => decodeURIComponent(answer));

      return {
        id: `q-${Date.now()}-${index}`,
        question: decodeHtml(decodeURIComponent(item.question || "")),
        category: decodeHtml(decodeURIComponent(item.category || "Trivia")),
        difficulty: decodeURIComponent(item.difficulty || "mixed"),
        correctAnswer: decodeHtml(correctAnswer),
        answers: shuffle([correctAnswer, ...incorrectAnswers].map(decodeHtml)),
      };
    });

    return Response.json({ questions });
  } catch (error) {
    console.error("Quiz question fetch error:", error);
    return Response.json({ error: "Quiz questions are not available right now." }, { status: 500 });
  }
}
