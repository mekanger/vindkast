import { useUserSettings } from '@/hooks/useUserSettings';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { NavLink } from '@/components/NavLink';
import { ArrowLeft } from 'lucide-react';
import type { WindUnit } from '@/types/settings';

export default function Settings() {
  const { windUnit, updateWindUnit, loading } = useUserSettings();

  const handleUnitChange = (value: string) => {
    updateWindUnit(value as WindUnit);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <NavLink to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
              Tilbake
            </NavLink>
            <h1 className="text-xl font-semibold">Innstillinger</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Vindenhet</CardTitle>
            <CardDescription>
              Velg hvilken enhet du vil bruke for å vise vindstyrke
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-muted-foreground">Laster...</div>
            ) : (
              <RadioGroup
                value={windUnit}
                onValueChange={handleUnitChange}
                className="space-y-3"
              >
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="ms" id="ms" />
                  <Label htmlFor="ms" className="cursor-pointer">
                    Meter per sekund (m/s)
                  </Label>
                </div>
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="knots" id="knots" />
                  <Label htmlFor="knots" className="cursor-pointer">
                    Knop (kn)
                  </Label>
                </div>
              </RadioGroup>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
