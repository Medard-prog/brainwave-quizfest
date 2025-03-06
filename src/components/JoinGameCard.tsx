
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowRight, Scan } from "lucide-react";
import { useNavigate } from "react-router-dom";

const JoinGameCard = () => {
  const [gamePin, setGamePin] = useState("");
  const [isPinValid, setIsPinValid] = useState(true);
  const navigate = useNavigate();

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setGamePin(value);
    setIsPinValid(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (gamePin.length === 6) {
      navigate(`/play/${gamePin}`);
    } else {
      setIsPinValid(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-md border border-gray-100 max-w-md w-full">
      <h2 className="text-2xl font-bold mb-6 text-center">Join a Game</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="game-pin" className="block text-sm font-medium text-brainblitz-dark-gray mb-2">
            Enter Game PIN
          </label>
          <Input
            id="game-pin"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            placeholder="000000"
            value={gamePin}
            onChange={handlePinChange}
            className={`text-center text-2xl tracking-widest ${!isPinValid ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
          />
          {!isPinValid && (
            <p className="text-red-500 text-sm mt-1">Please enter a valid 6-digit PIN</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Button
            type="button"
            variant="outline"
            className="flex items-center justify-center gap-2"
          >
            <Scan size={18} />
            Scan QR
          </Button>
          <Button
            type="submit"
            className="bg-brainblitz-primary hover:bg-brainblitz-primary/90 flex items-center justify-center gap-2"
          >
            Enter
            <ArrowRight size={18} />
          </Button>
        </div>
      </form>

      <div className="mt-8 pt-6 border-t border-gray-200">
        <p className="text-center text-sm text-brainblitz-medium-gray">
          Want to create your own quiz?{" "}
          <a href="/register" className="text-brainblitz-primary hover:underline">
            Sign up for free
          </a>
        </p>
      </div>
    </div>
  );
};

export default JoinGameCard;
