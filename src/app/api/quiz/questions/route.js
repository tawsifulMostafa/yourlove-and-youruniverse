export const dynamic = "force-dynamic";

const QUESTION_BANK = [
  { question: "If 5 cats catch 5 mice in 5 minutes, how many cats are needed to catch 100 mice in 100 minutes?", category: "Logic", correctAnswer: "5", answers: ["5", "20", "100", "25"] },
  { question: "What comes next: 2, 4, 8, 16, ?", category: "Pattern", correctAnswer: "32", answers: ["24", "30", "32", "36"] },
  { question: "A farmer has 17 sheep. All but 9 run away. How many are left?", category: "Trick", correctAnswer: "9", answers: ["8", "9", "17", "26"] },
  { question: "Which word does not belong: apple, banana, carrot, mango?", category: "Odd one out", correctAnswer: "carrot", answers: ["apple", "banana", "carrot", "mango"] },
  { question: "If today is Monday, what day will it be after 10 days?", category: "Logic", correctAnswer: "Thursday", answers: ["Wednesday", "Thursday", "Friday", "Saturday"] },
  { question: "What is half of 2 plus 2?", category: "Trick math", correctAnswer: "3", answers: ["2", "3", "4", "1"] },
  { question: "Which number is missing: 3, 6, 9, 12, ?", category: "Pattern", correctAnswer: "15", answers: ["14", "15", "16", "18"] },
  { question: "You have one match and enter a dark room with a candle, lamp, and stove. What do you light first?", category: "Trick", correctAnswer: "the match", answers: ["the candle", "the lamp", "the stove", "the match"] },
  { question: "What has keys but cannot open locks?", category: "Riddle", correctAnswer: "piano", answers: ["map", "piano", "clock", "book"] },
  { question: "If 12 + 3 = 45, 10 + 2 = 32, then 8 + 4 = ?", category: "Pattern", correctAnswer: "412", answers: ["12", "48", "412", "324"] },
  { question: "What is always in front of you but cannot be seen?", category: "Riddle", correctAnswer: "future", answers: ["future", "air", "light", "shadow"] },
  { question: "Which is heavier: 1 kg of cotton or 1 kg of iron?", category: "Trick", correctAnswer: "same weight", answers: ["cotton", "iron", "same weight", "depends"] },
  { question: "Complete: 1, 1, 2, 3, 5, 8, ?", category: "Pattern", correctAnswer: "13", answers: ["11", "12", "13", "15"] },
  { question: "A clock shows 3:15. What is the angle between hour and minute hands?", category: "Logic", correctAnswer: "7.5 degrees", answers: ["0 degrees", "7.5 degrees", "15 degrees", "30 degrees"] },
  { question: "What has a neck but no head?", category: "Riddle", correctAnswer: "bottle", answers: ["shirt", "bottle", "guitar", "river"] },
  { question: "If all bloops are razzies and all razzies are lazzies, are all bloops definitely lazzies?", category: "Logic", correctAnswer: "yes", answers: ["yes", "no", "only some", "cannot tell"] },
  { question: "Find the odd one: 16, 25, 36, 49, 60", category: "Odd one out", correctAnswer: "60", answers: ["16", "25", "49", "60"] },
  { question: "What number should replace ?: 4, 9, 16, 25, ?", category: "Pattern", correctAnswer: "36", answers: ["30", "34", "36", "49"] },
  { question: "A plane crashes on the border of two countries. Where do they bury survivors?", category: "Trick", correctAnswer: "they do not", answers: ["left country", "right country", "border", "they do not"] },
  { question: "What has many teeth but cannot bite?", category: "Riddle", correctAnswer: "comb", answers: ["comb", "saw", "zipper", "gear"] },
  { question: "If 7 people meet and each shakes hands once with every other person, how many handshakes happen?", category: "Math", correctAnswer: "21", answers: ["14", "21", "28", "49"] },
  { question: "Which comes next: A, C, F, J, O, ?", category: "Pattern", correctAnswer: "U", answers: ["S", "T", "U", "V"] },
  { question: "What can travel around the world while staying in a corner?", category: "Riddle", correctAnswer: "stamp", answers: ["stamp", "coin", "phone", "shadow"] },
  { question: "If you rearrange LISTEN, what word can you make?", category: "Word", correctAnswer: "SILENT", answers: ["SILENT", "TINSEL", "ENLIST", "All of these"] },
  { question: "What is 15 percent of 200?", category: "Math", correctAnswer: "30", answers: ["15", "20", "30", "35"] },
  { question: "What gets wetter the more it dries?", category: "Riddle", correctAnswer: "towel", answers: ["soap", "towel", "rain", "sponge"] },
  { question: "A is taller than B. C is taller than A. Who is shortest?", category: "Logic", correctAnswer: "B", answers: ["A", "B", "C", "Cannot tell"] },
  { question: "What is next: 100, 90, 81, 73, ?", category: "Pattern", correctAnswer: "66", answers: ["64", "65", "66", "67"] },
  { question: "Which month has 28 days?", category: "Trick", correctAnswer: "all months", answers: ["February", "April", "all months", "none"] },
  { question: "If 3x = 18, what is x + 4?", category: "Math", correctAnswer: "10", answers: ["6", "8", "10", "14"] },
  { question: "What has hands but cannot clap?", category: "Riddle", correctAnswer: "clock", answers: ["clock", "robot", "doll", "tree"] },
  { question: "Find the missing number: 2, 6, 12, 20, ?", category: "Pattern", correctAnswer: "30", answers: ["28", "30", "32", "36"] },
  { question: "If a red house is made of red bricks and a blue house of blue bricks, what is a greenhouse made of?", category: "Trick", correctAnswer: "glass", answers: ["green bricks", "plants", "glass", "wood"] },
  { question: "Which is the smallest prime number?", category: "Math", correctAnswer: "2", answers: ["0", "1", "2", "3"] },
  { question: "What has one eye but cannot see?", category: "Riddle", correctAnswer: "needle", answers: ["needle", "storm", "camera", "button"] },
  { question: "If 2 workers build 2 walls in 2 hours, how many workers build 6 walls in 6 hours?", category: "Logic", correctAnswer: "2", answers: ["2", "3", "6", "12"] },
  { question: "Which number is missing: 1, 4, 9, 16, 25, ?", category: "Pattern", correctAnswer: "36", answers: ["30", "35", "36", "49"] },
  { question: "What can you catch but not throw?", category: "Riddle", correctAnswer: "cold", answers: ["ball", "cold", "fish", "idea"] },
  { question: "If 9 + 1 = 1 on a clock, then 10 + 5 = ?", category: "Logic", correctAnswer: "3", answers: ["2", "3", "15", "5"] },
  { question: "Which word is spelled incorrectly in every dictionary?", category: "Trick", correctAnswer: "incorrectly", answers: ["wrong", "incorrectly", "dictionary", "spelled"] },
];

function shuffle(items) {
  const nextItems = [...items];
  for (let index = nextItems.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [nextItems[index], nextItems[swapIndex]] = [nextItems[swapIndex], nextItems[index]];
  }
  return nextItems;
}

export async function GET() {
  const questions = shuffle(QUESTION_BANK)
    .slice(0, 20)
    .map((item, index) => ({
      id: `brain-${Date.now()}-${index}`,
      ...item,
      answers: shuffle(item.answers),
    }));

  return Response.json({ questions });
}
