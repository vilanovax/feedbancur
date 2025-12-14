"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Loader2, ArrowRight, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Department {
  id: string;
  name: string;
}

interface Assignment {
  id: string;
  departmentId: string;
  isRequired: boolean;
  startDate: string | null;
  endDate: string | null;
  allowManagerView: boolean;
  department: Department;
}

export default function AssignAssessmentPage() {
  const params = useParams();
  const router = useRouter();
  const assessmentId = params.id as string;
  const [departments, setDepartments] = useState<Department[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedDepartments, setSelectedDepartments] = useState<Set<string>>(
    new Set()
  );
  const [assignmentData, setAssignmentData] = useState<
    Record<
      string,
      {
        isRequired: boolean;
        startDate: string;
        endDate: string;
        allowManagerView: boolean;
      }
    >
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [depsResponse, assignResponse] = await Promise.all([
        fetch("/api/departments"),
        fetch(`/api/assessments/${assessmentId}/assignments`),
      ]);

      if (depsResponse.ok) {
        const depsData = await depsResponse.json();
        setDepartments(depsData);
      }

      if (assignResponse.ok) {
        const assignData = await assignResponse.json();
        setAssignments(assignData);

        // Initialize selected departments and their data
        const selected = new Set(assignData.map((a: Assignment) => a.departmentId));
        setSelectedDepartments(selected);

        const data: Record<string, any> = {};
        assignData.forEach((a: Assignment) => {
          data[a.departmentId] = {
            isRequired: a.isRequired,
            startDate: a.startDate
              ? new Date(a.startDate).toISOString().split("T")[0]
              : "",
            endDate: a.endDate
              ? new Date(a.endDate).toISOString().split("T")[0]
              : "",
            allowManagerView: a.allowManagerView,
          };
        });
        setAssignmentData(data);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("خطا در بارگذاری داده‌ها");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDepartmentToggle = (departmentId: string) => {
    const newSelected = new Set(selectedDepartments);
    if (newSelected.has(departmentId)) {
      newSelected.delete(departmentId);
      const newData = { ...assignmentData };
      delete newData[departmentId];
      setAssignmentData(newData);
    } else {
      newSelected.add(departmentId);
      setAssignmentData({
        ...assignmentData,
        [departmentId]: {
          isRequired: false,
          startDate: "",
          endDate: "",
          allowManagerView: false,
        },
      });
    }
    setSelectedDepartments(newSelected);
  };

  const handleDataChange = (
    departmentId: string,
    field: string,
    value: any
  ) => {
    setAssignmentData({
      ...assignmentData,
      [departmentId]: {
        ...assignmentData[departmentId],
        [field]: value,
      },
    });
  };

  const handleSelectAll = () => {
    if (selectedDepartments.size === departments.length) {
      setSelectedDepartments(new Set());
      setAssignmentData({});
    } else {
      const allIds = new Set(departments.map((d) => d.id));
      setSelectedDepartments(allIds);

      const newData: Record<string, any> = {};
      departments.forEach((d) => {
        newData[d.id] = assignmentData[d.id] || {
          isRequired: false,
          startDate: "",
          endDate: "",
          allowManagerView: false,
        };
      });
      setAssignmentData(newData);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // First, remove assignments that are no longer selected
      const currentAssignmentIds = new Set(
        assignments.map((a) => a.departmentId)
      );
      const toRemove = [...currentAssignmentIds].filter(
        (id) => !selectedDepartments.has(id)
      );

      for (const deptId of toRemove) {
        await fetch(
          `/api/assessments/${assessmentId}/assign?departmentId=${deptId}`,
          { method: "DELETE" }
        );
      }

      // Then, create or update assignments for selected departments
      for (const deptId of selectedDepartments) {
        const data = assignmentData[deptId];
        await fetch(`/api/assessments/${assessmentId}/assign`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            departmentId: deptId,
            isRequired: data.isRequired,
            startDate: data.startDate || null,
            endDate: data.endDate || null,
            allowManagerView: data.allowManagerView,
          }),
        });
      }

      toast.success("تخصیص‌ها با موفقیت ذخیره شد");
      router.push("/assessments");
    } catch (error) {
      console.error("Error saving assignments:", error);
      toast.error("خطا در ذخیره تخصیص‌ها");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/assessments")}
          className="mb-4"
        >
          <ArrowRight className="w-4 h-4 ml-2" />
          بازگشت
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">تخصیص آزمون به بخش‌ها</h1>
            <p className="text-muted-foreground mt-2">
              انتخاب بخش‌ها و تنظیمات دسترسی
            </p>
          </div>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
            <Save className="w-4 h-4 ml-2" />
            ذخیره
          </Button>
        </div>
      </div>

      <Card className="mb-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>انتخاب بخش‌ها</CardTitle>
            <Button variant="outline" size="sm" onClick={handleSelectAll}>
              {selectedDepartments.size === departments.length
                ? "حذف همه"
                : "انتخاب همه"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {departments.map((dept) => (
              <div
                key={dept.id}
                className="flex items-center space-x-2 space-x-reverse"
              >
                <Checkbox
                  id={dept.id}
                  checked={selectedDepartments.has(dept.id)}
                  onCheckedChange={() => handleDepartmentToggle(dept.id)}
                />
                <Label htmlFor={dept.id} className="flex-1 cursor-pointer">
                  {dept.name}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedDepartments.size > 0 && (
        <div className="space-y-4">
          {[...selectedDepartments].map((deptId) => {
            const dept = departments.find((d) => d.id === deptId);
            if (!dept) return null;

            const data = assignmentData[deptId] || {
              isRequired: false,
              startDate: "",
              endDate: "",
              allowManagerView: false,
            };

            return (
              <Card key={deptId}>
                <CardHeader>
                  <CardTitle className="text-lg">{dept.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`start-${deptId}`}>تاریخ شروع</Label>
                      <Input
                        id={`start-${deptId}`}
                        type="date"
                        value={data.startDate}
                        onChange={(e) =>
                          handleDataChange(deptId, "startDate", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`end-${deptId}`}>تاریخ پایان</Label>
                      <Input
                        id={`end-${deptId}`}
                        type="date"
                        value={data.endDate}
                        onChange={(e) =>
                          handleDataChange(deptId, "endDate", e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor={`required-${deptId}`}>اجباری</Label>
                      <p className="text-sm text-muted-foreground">
                        آزمون برای این بخش اجباری است
                      </p>
                    </div>
                    <Switch
                      id={`required-${deptId}`}
                      checked={data.isRequired}
                      onCheckedChange={(checked) =>
                        handleDataChange(deptId, "isRequired", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor={`manager-${deptId}`}>
                        نمایش برای مدیر
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        مدیر بخش می‌تواند نتایج را ببیند
                      </p>
                    </div>
                    <Switch
                      id={`manager-${deptId}`}
                      checked={data.allowManagerView}
                      onCheckedChange={(checked) =>
                        handleDataChange(deptId, "allowManagerView", checked)
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
