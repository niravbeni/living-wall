"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";

interface PinGateProps {
  children: React.ReactNode;
}

export function PinGate({ children }: PinGateProps) {
  const [pin, setPin] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState(false);

  const requiredPin = process.env.NEXT_PUBLIC_CMS_PIN;

  if (!requiredPin || authenticated) {
    return <>{children}</>;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === requiredPin) {
      setAuthenticated(true);
      setError(false);
    } else {
      setError(true);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-xs space-y-4 text-center"
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Lock className="h-6 w-6 text-muted-foreground" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">CMS Access</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Enter PIN to continue
          </p>
        </div>
        <Input
          type="password"
          placeholder="PIN"
          value={pin}
          onChange={(e) => {
            setPin(e.target.value);
            setError(false);
          }}
          className={error ? "border-destructive" : ""}
          autoFocus
        />
        {error && (
          <p className="text-sm text-destructive">Incorrect PIN</p>
        )}
        <Button type="submit" className="w-full cursor-pointer">
          Enter
        </Button>
      </form>
    </div>
  );
}
