import { Wind, MapPin } from "lucide-react";

export const EmptyState = () => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="relative mb-6">
        <div className="p-6 rounded-full bg-primary/10 animate-float">
          <Wind className="w-12 h-12 text-primary animate-wind" />
        </div>
        <div className="absolute -bottom-1 -right-1 p-2 rounded-full bg-accent/20">
          <MapPin className="w-5 h-5 text-accent" />
        </div>
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">
        Ingen steder lagt til
      </h3>
      <p className="text-muted-foreground max-w-md">
        Søk etter et sted ovenfor for å se værmelding for de neste 3 dagene.
      </p>
      <p className="text-muted-foreground max-w-md mt-2">
        Du må logge deg inn for å kunne lagre stedene dine.
      </p>
    </div>
  );
};
