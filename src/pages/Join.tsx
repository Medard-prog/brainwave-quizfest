
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { QrScanner } from "@yudiel/react-qr-scanner";
import { Gamepad2, QrCode, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MainLayout from "@/layouts/MainLayout";

const Join = () => {
  const navigate = useNavigate();
  const [gamePin, setGamePin] = useState("");
  const [isCheckingPin, setIsCheckingPin] = useState(false);
  const [qrScannerEnabled, setQrScannerEnabled] = useState(false);
  
  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!gamePin.trim()) {
      toast.error("Please enter a game PIN");
      return;
    }
    
    setIsCheckingPin(true);
    navigate(`/join/${gamePin.trim()}`);
  };
  
  const handleQrCodeScanned = (result: string) => {
    console.log("QR Code scanned:", result);
    
    try {
      // Extract the game PIN from the URL
      // Expected format: http(s)://{domain}/join/{PIN}
      const url = new URL(result);
      const pathParts = url.pathname.split('/');
      const pin = pathParts[pathParts.length - 1];
      
      if (pin) {
        navigate(`/join/${pin}`);
      } else {
        toast.error("Invalid QR code");
      }
    } catch (error) {
      console.error("Error parsing QR code:", error);
      toast.error("Invalid QR code");
    }
  };
  
  return (
    <MainLayout>
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <Gamepad2 className="mx-auto h-12 w-12 text-brainblitz-primary mb-4" />
          <h1 className="text-2xl font-bold mb-2">Join a Game</h1>
          <p className="text-brainblitz-dark-gray">
            Enter a game PIN or scan a QR code to join a game
          </p>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <Tabs defaultValue="pin">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="pin">Game PIN</TabsTrigger>
              <TabsTrigger 
                value="qr"
                onClick={() => setQrScannerEnabled(true)}
              >
                QR Code
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="pin">
              <form onSubmit={handlePinSubmit}>
                <div className="mb-6">
                  <div className="flex">
                    <Input
                      type="text"
                      value={gamePin}
                      onChange={(e) => setGamePin(e.target.value)}
                      placeholder="Enter game PIN"
                      className="rounded-r-none text-center text-xl tracking-widest"
                      maxLength={6}
                    />
                    <Button 
                      type="submit" 
                      className="rounded-l-none"
                      disabled={isCheckingPin || !gamePin.trim()}
                    >
                      {isCheckingPin ? (
                        <Spinner size="sm" />
                      ) : (
                        <ArrowRight className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            </TabsContent>
            
            <TabsContent value="qr">
              <div className="text-center">
                {qrScannerEnabled ? (
                  <div className="relative rounded-lg overflow-hidden border border-gray-200">
                    <QrScanner
                      onDecode={handleQrCodeScanned}
                      onError={(error) => {
                        console.error("QR scanner error:", error);
                        toast.error("Error accessing camera");
                      }}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 border border-dashed border-gray-300 rounded-lg">
                    <QrCode className="h-12 w-12 text-brainblitz-dark-gray mb-4" />
                    <p className="text-brainblitz-dark-gray mb-4">
                      Scan a QR code to join a game
                    </p>
                    <Button
                      onClick={() => setQrScannerEnabled(true)}
                      variant="outline"
                    >
                      Enable Camera
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
};

export default Join;
