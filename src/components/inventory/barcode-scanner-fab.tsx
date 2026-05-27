"use client";

import { useState, useCallback } from "react";
import { useZxing } from "react-zxing";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Camera, X, AlertCircle } from "lucide-react";

interface BarcodeScannerFabProps {
  /** Called when a barcode is scanned. Returns the decoded text. */
  onScan: (barcode: string) => void;
}

export function BarcodeScannerFab({ onScan }: BarcodeScannerFabProps) {
  const [open, setOpen] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [scanned, setScanned] = useState(false);

  const handleResult = useCallback(
    (result: { getText: () => string }) => {
      if (scanned) return;
      setScanned(true);
      const text = result.getText();
      setOpen(false);
      setTimeout(() => {
        setScanned(false);
        onScan(text);
      }, 100);
    },
    [scanned, onScan]
  );

  const { ref } = useZxing({
    onResult: handleResult,
    onError: (err) => {
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        setPermissionDenied(true);
      }
    },
    paused: !open,
  });

  function openScanner() {
    setPermissionDenied(false);
    setScanned(false);
    setOpen(true);
  }

  return (
    <>
      {/* FAB — only visible on mobile (<lg) */}
      <button
        aria-label="Scan barcode"
        onClick={openScanner}
        className="lg:hidden fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 active:scale-95 transition-transform"
      >
        <Camera className="h-6 w-6" />
      </button>

      {/* Scanner dialog */}
      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) setPermissionDenied(false);
        }}
      >
        <DialogContent className="sm:max-w-sm p-0 overflow-hidden">
          <DialogHeader className="px-4 pt-4 pb-2">
            <DialogTitle>Scan barcode</DialogTitle>
          </DialogHeader>

          {permissionDenied ? (
            <div className="px-4 pb-6 space-y-3 text-center">
              <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
              <p className="text-sm font-medium">Camera access denied</p>
              <p className="text-xs text-muted-foreground">
                To scan barcodes, allow camera access in your browser settings,
                then try again.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOpen(false)}
              >
                Close
              </Button>
            </div>
          ) : (
            <div className="relative bg-black aspect-square w-full">
              <video ref={ref} className="w-full h-full object-cover" />
              {/* Aim guide */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-32 border-2 border-white/70 rounded-lg" />
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 text-white hover:bg-white/20"
                onClick={() => setOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          )}

          <p className="px-4 py-2 text-center text-xs text-muted-foreground">
            Point at a barcode to scan
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
