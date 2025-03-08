
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { QrScanner } from "@yudiel/react-qr-scanner";
import { Gamepad2, QrCode, ArrowRight, Scan } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MainLayout from "@/layouts/MainLayout";
import { Badge } from "@/components/ui/badge";

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
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="bg-brainblitz-primary/10 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Gamepad2 className="h-10 w-10 text-brainblitz-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Join a Game</h1>
            <p className="text-brainblitz-dark-gray">
              Enter a game PIN or scan a QR code to join a quiz game
            </p>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <Tabs defaultValue="pin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="pin" className="text-base">Game PIN</TabsTrigger>
                <TabsTrigger 
                  value="qr"
                  onClick={() => setQrScannerEnabled(true)}
                  className="text-base"
                >
                  QR Code
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="pin">
                <form onSubmit={handlePinSubmit} className="space-y-4">
                  <div>
                    <div className="relative">
                      <Input
                        type="text"
                        value={gamePin}
                        onChange={(e) => setGamePin(e.target.value)}
                        placeholder="Enter 6-digit game PIN"
                        className="text-center text-xl tracking-widest pr-12 py-6"
                        maxLength={6}
                      />
                      <Button 
                        type="submit" 
                        size="icon"
                        className="absolute right-1 top-1/2 transform -translate-y-1/2"
                        disabled={isCheckingPin || !gamePin.trim()}
                      >
                        {isCheckingPin ? (
                          <Spinner size="sm" />
                        ) : (
                          <ArrowRight className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    
                    <div className="flex justify-center mt-6">
                      <Badge variant="outline" className="text-brainblitz-dark-gray">
                        PIN Example: 123456
                      </Badge>
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full mt-4 py-6 text-lg bg-brainblitz-primary hover:bg-brainblitz-primary/90"
                    disabled={isCheckingPin || !gamePin.trim()}
                  >
                    {isCheckingPin ? (
                      <>
                        <Spinner size="sm" className="mr-2" />
                        Joining...
                      </>
                    ) : (
                      "Join Game"
                    )}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="qr">
                <div className="text-center">
                  {qrScannerEnabled ? (
                    <div className="relative rounded-lg overflow-hidden border border-gray-200">
                      <div className="absolute inset-0 z-10 pointer-events-none">
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="w-48 h-48 border-2 border-brainblitz-primary rounded-lg"></div>
                        </div>
                      </div>
                      <QrScanner
                        onDecode={handleQrCodeScanned}
                        onError={(error) => {
                          console.error("QR scanner error:", error);
                          toast.error("Error accessing camera");
                        }}
                        containerStyle={{ borderRadius: '0.5rem' }}
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-8 border border-dashed border-gray-300 rounded-lg bg-gray-50">
                      <QrCode className="h-16 w-16 text-brainblitz-dark-gray mb-4" />
                      <p className="text-brainblitz-dark-gray mb-4">
                        Scan a QR code to join a game
                      </p>
                      <Button
                        onClick={() => setQrScannerEnabled(true)}
                        className="bg-brainblitz-primary hover:bg-brainblitz-primary/90"
                      >
                        <Scan className="mr-2 h-4 w-4" />
                        Enable Camera
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
          
          <p className="text-center text-sm text-brainblitz-dark-gray mt-6">
            Need help? Contact your game host for the correct PIN or QR code.
          </p>
        </div>
      </div>
    </MainLayout>
  );
};

export default Join;
