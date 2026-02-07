"use client";

import { memo } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Clock, FileQuestion, Users, CheckCircle2 } from "lucide-react";
import { badgeVariants } from "@/lib/design-tokens";

interface AssessmentCardProps {
  assessment: {
    id: string;
    title: string;
    description?: string | null;
    type: string;
    isActive?: boolean;
    timeLimit?: number | null;
    _count?: {
      questions: number;
      assignments?: number;
      results?: number;
    };
  };
  actions?: React.ReactNode;
  showStats?: boolean;
}

function AssessmentCardComponent({
  assessment,
  actions,
  showStats = false,
}: AssessmentCardProps) {
  const getTypeLabel = (type: string) => {
    switch (type) {
      case "MBTI":
        return {
          label: "MBTI",
          color: badgeVariants.purple
        };
      case "DISC":
        return {
          label: "DISC",
          color: badgeVariants.primary
        };
      case "HOLLAND":
        return {
          label: "هالند",
          color: badgeVariants.success
        };
      case "MSQ":
        return {
          label: "MSQ",
          color: badgeVariants.warning
        };
      case "CUSTOM":
        return {
          label: "سفارشی",
          color: badgeVariants.secondary
        };
      default:
        return {
          label: type,
          color: badgeVariants.secondary
        };
    }
  };

  const typeInfo = getTypeLabel(assessment.type);

  return (
    <Card className="hover:shadow-md transition-shadow dark:bg-secondary-800 dark:border-secondary-700">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={typeInfo.color} variant="secondary">
                {typeInfo.label}
              </Badge>
            </div>
            <CardTitle className="text-xl mb-2 text-secondary-900 dark:text-white">{assessment.title}</CardTitle>
            {assessment.description && (
              <CardDescription className="line-clamp-2 text-secondary-600 dark:text-secondary-400">
                {assessment.description}
              </CardDescription>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            {showStats && assessment._count?.assignments !== undefined && (
              <div className="flex items-center gap-2 text-sm text-secondary-600 dark:text-secondary-400">
                <Users className="w-4 h-4 text-secondary-500 dark:text-secondary-500" />
                <span>{assessment._count.assignments} بخش</span>
              </div>
            )}

            {assessment._count?.questions !== undefined && (
              <div className="flex items-center gap-2 text-sm text-secondary-600 dark:text-secondary-400">
                <FileQuestion className="w-4 h-4 text-secondary-500 dark:text-secondary-500" />
                <span>{assessment._count.questions} سوال</span>
              </div>
            )}

            {showStats && assessment._count?.results !== undefined && (
              <div className="flex items-center gap-2 text-sm text-secondary-600 dark:text-secondary-400">
                <CheckCircle2 className="w-4 h-4 text-secondary-500 dark:text-secondary-500" />
                <span>{assessment._count.results} شرکت‌کننده</span>
              </div>
            )}

            {assessment.timeLimit && (
              <div className="flex items-center gap-2 text-sm text-secondary-600 dark:text-secondary-400">
                <Clock className="w-4 h-4 text-secondary-500 dark:text-secondary-500" />
                <span>{assessment.timeLimit} دقیقه</span>
              </div>
            )}
          </div>

          {assessment.isActive !== undefined && (
            <div className="mt-4 pt-3 border-t border-secondary-200 dark:border-secondary-700">
              <Badge
                variant={assessment.isActive ? "default" : "secondary"}
                className={assessment.isActive ? badgeVariants.success : badgeVariants.secondary}
              >
                {assessment.isActive ? "فعال" : "غیرفعال"}
              </Badge>
            </div>
          )}
        </div>
      </CardContent>

      {actions && <CardFooter className="pt-4">{actions}</CardFooter>}
    </Card>
  );
}

export const AssessmentCard = memo(AssessmentCardComponent);
