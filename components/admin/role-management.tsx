"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RoleForm, RoleCard, RoleList } from "@/components/form";
import { Shield } from "lucide-react";

interface RoleManagementProps {
  adminUserId: string;
}

export function RoleManagement({ adminUserId }: RoleManagementProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Gestion des Rôles
          </CardTitle>
          <CardDescription>
            Créez et gérez les rôles utilisateurs du système
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            {/* Formulaire de création de rôle */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Créer un nouveau rôle</h3>
              <RoleForm />
            </div>
            
            {/* Liste des rôles existants */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Rôles existants</h3>
              <RoleList />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
