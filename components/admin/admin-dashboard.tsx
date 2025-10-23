"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserManagement } from "./user-management";
import { TeacherAssignment } from "./teacher-assignment";
import { ActivityLogs } from "./activity-logs";
import { RoleManagement } from "./role-management";
import { Users, UserCheck, Activity, Shield } from "lucide-react";

interface AdminDashboardProps {
  adminUserId: string;
}

export function AdminDashboard({ adminUserId }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState("users");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Panneau d'Administration</CardTitle>
        <CardDescription>
          Gérez les utilisateurs, affectations, rôles et supervisez l'activité du système
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Utilisateurs
            </TabsTrigger>
            <TabsTrigger value="assignments" className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Affectations
            </TabsTrigger>
            <TabsTrigger value="roles" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Rôles
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Journal
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="users" className="space-y-4">
            <UserManagement adminUserId={adminUserId} />
          </TabsContent>
          
          <TabsContent value="assignments" className="space-y-4">
            <TeacherAssignment adminUserId={adminUserId} />
          </TabsContent>
          
          <TabsContent value="roles" className="space-y-4">
            <RoleManagement adminUserId={adminUserId} />
          </TabsContent>
          
          <TabsContent value="logs" className="space-y-4">
            <ActivityLogs adminUserId={adminUserId} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
