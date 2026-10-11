"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { setUserActiveAction, setUserRoleAction } from "@/actions/admin";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ROLE_LABEL, ROLES, type RoleName } from "@/lib/constants";

export function RoleSelect({ userId, role }: { userId: string; role: RoleName }) {
  const [value, setValue] = useState(role);
  const [pending, start] = useTransition();
  return (
    <Select
      value={value}
      disabled={pending}
      onValueChange={(next) => {
        const previous = value;
        setValue(next as RoleName);
        start(async () => {
          const res = await setUserRoleAction(userId, next as RoleName);
          if (res.ok) toast.success(res.message);
          else {
            setValue(previous);
            toast.error(res.error);
          }
        });
      }}
    >
      <SelectTrigger className="h-8 w-40 bg-cream-soft">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ROLES.map((r) => (
          <SelectItem key={r} value={r}>
            {ROLE_LABEL[r]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function ActiveToggle({ userId, active, disabled }: { userId: string; active: boolean; disabled?: boolean }) {
  const [value, setValue] = useState(active);
  const [pending, start] = useTransition();
  return (
    <Switch
      checked={value}
      disabled={disabled || pending}
      onCheckedChange={(next) => {
        setValue(next);
        start(async () => {
          const res = await setUserActiveAction(userId, next);
          if (res.ok) toast.success(res.message);
          else {
            setValue(!next);
            toast.error(res.error);
          }
        });
      }}
    />
  );
}
