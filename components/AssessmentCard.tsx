"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Clock, FileQuestion, Users, CheckCircle2 } from "lucide-react";

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

export function AssessmentCard({
  assessment,
  actions,
  showStats = false,
}: AssessmentCardProps) {
  const getTypeLabel = (type: string) => {
    switch (type) {
      case "MBTI":
        return { label: "MBTI", color: "bg-purple-100 text-purple-800" };
      case "DISC":
        return { label: "DISC", color: "bg-blue-100 text-blue-800" };
      case "CUSTOM":
        return { label: "سفارشی", color: "bg-gray-100 text-gray-800" };
      default:
        return { label: type, color: "bg-gray-100 text-gray-800" };
    }
  };

  const typeInfo = getTypeLabel(assessment.type);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl mb-2">{assessment.title}</CardTitle>
            {assessment.description && (
              <CardDescription className="line-clamp-2">
                {assessment.description}
              </CardDescription>
            )}
          </div>
          <Badge className={typeInfo.color} variant="secondary">
            {typeInfo.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {assessment._count && (
            <>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileQuestion className="w-4 h-4" />
                <span>{assessment._count.questions} سوال</span>
              </div>

              {showStats && assessment._count.assignments !== undefined && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span>{assessment._count.assignments} بخش</span>
                </div>
              )}

              {showStats && assessment._count.results !== undefined && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{assessment._count.results} شرکت‌کننده</span>
                </div>
              )}
            </>
          )}

          {assessment.timeLimit && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>{assessment.timeLimit} دقیقه</span>
            </div>
          )}
        </div>

        {assessment.isActive !== undefined && (
          <div className="mt-4">
            <Badge
              variant={assessment.isActive ? "default" : "secondary"}
              className={
                assessment.isActive
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-800"
              }
            >
              {assessment.isActive ? "فعال" : "غیرفعال"}
            </Badge>
          </div>
        )}
      </CardContent>

      {actions && <CardFooter>{actions}</CardFooter>}
    </Card>
  );
}
