"use client";

import { useRef } from "react";
import QRCode from "react-qr-code";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, X } from "lucide-react";

interface QrLabelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  location: string;
  /** Top items at this location, sorted by quantity desc */
  items: { name: string; quantity: number; unit: string }[];
}

export function QrLabelDialog({
  open,
  onOpenChange,
  location,
  items,
}: QrLabelDialogProps) {
  const printRef = useRef<HTMLDivElement>(null);

  // Build the URL the QR code encodes: inventory page filtered to this location.
  // Use relative path — will resolve to the current origin when scanned.
  const qrUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/inventory?location=${encodeURIComponent(location)}`
      : `/inventory?location=${encodeURIComponent(location)}`;

  function handlePrint() {
    const printContent = printRef.current?.innerHTML ?? "";
    const win = window.open("", "_blank", "width=600,height=400");
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Label — ${location}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: -apple-system, sans-serif; background: #fff; color: #000; }
            .label { width: 4in; padding: 0.25in; display: flex; flex-direction: column; gap: 12px; }
            .header { font-size: 18px; font-weight: 700; }
            .qr { display: flex; justify-content: center; }
            .items-title { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #555; margin-top: 4px; }
            .item-row { font-size: 12px; display: flex; justify-content: space-between; border-bottom: 1px solid #eee; padding: 3px 0; }
            .item-qty { color: #555; font-size: 11px; }
          </style>
        </head>
        <body>${printContent}</body>
      </html>
    `);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  }

  const topItems = items.slice(0, 5);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>QR label — {location}</DialogTitle>
        </DialogHeader>

        {/* Print preview */}
        <div ref={printRef} className="label">
          <div className="header">{location}</div>
          <div className="qr">
            <QRCode value={qrUrl} size={160} />
          </div>
          {topItems.length > 0 && (
            <>
              <p className="items-title">Top items</p>
              {topItems.map((item, i) => (
                <div key={i} className="item-row">
                  <span>{item.name}</span>
                  <span className="item-qty">
                    {item.quantity} {item.unit}
                  </span>
                </div>
              ))}
            </>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="gap-1.5"
          >
            <X className="h-3.5 w-3.5" />
            Close
          </Button>
          <Button onClick={handlePrint} className="gap-1.5">
            <Printer className="h-3.5 w-3.5" />
            Print
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
