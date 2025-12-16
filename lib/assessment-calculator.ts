import { calculateMBTI } from "./assessment-calculators/mbti";
import { calculateDISC } from "./assessment-calculators/disc";
import { calculateHolland } from "./assessment-calculators/holland";
import { calculateMSQ } from "./assessment-calculators/msq";

interface Assessment {
  id: string;
  type: string;
  passingScore: number | null;
  questions: any[];
}

interface CalculationResult {
  score: number;
  personality: string;
  details?: any;
}

export function calculateAssessmentScore(
  assessment: Assessment,
  answers: Record<string, string>
): CalculationResult {
  switch (assessment.type) {
    case "MBTI": {
      const mbtiResult = calculateMBTI(answers, assessment.questions);
      return {
        score: 100, // MBTI doesn't have a numeric score
        personality: mbtiResult.type,
        details: mbtiResult,
      };
    }
    case "DISC": {
      const discResult = calculateDISC(answers, assessment.questions);
      return {
        score: 100, // DISC doesn't have a numeric score
        personality: discResult.type,
        details: discResult,
      };
    }
    case "HOLLAND": {
      const hollandResult = calculateHolland(answers, assessment.questions);
      return {
        score: 100, // Holland doesn't have a numeric score
        personality: hollandResult.type,
        details: hollandResult,
      };
    }
    case "MSQ": {
      const msqResult = calculateMSQ(answers, assessment.questions);
      return {
        score: msqResult.percentages.total,
        personality: msqResult.level,
        details: msqResult,
      };
    }
    case "CUSTOM":
      return calculateCustom(assessment.questions, answers);
    default:
      throw new Error(`Unknown assessment type: ${assessment.type}`);
  }
}

function calculateCustom(
  questions: any[],
  answers: Record<string, string>
): CalculationResult {
  let totalScore = 0;
  let maxScore = 0;

  questions.forEach((question) => {
    const answer = answers[question.id];
    if (answer && question.options) {
      const selectedOption = question.options.find((opt: any) => opt.value === answer);
      if (selectedOption && selectedOption.score) {
        totalScore += selectedOption.score;
      }
    }

    // Max score is the highest option score for each question
    if (question.options && question.options.length > 0) {
      const maxOptionScore = Math.max(...question.options.map((opt: any) => opt.score || 0));
      maxScore += maxOptionScore;
    }
  });

  const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

  return {
    score: percentage,
    personality: `${percentage}%`,
    details: {
      totalScore,
      maxScore,
      percentage,
    },
  };
}
