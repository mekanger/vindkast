import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Settings2, Info } from 'lucide-react';
import { ActivityRuleForm } from './ActivityRuleForm';
import { ActivityRuleItem } from './ActivityRuleItem';
import { ActivityRuleEditDialog } from './ActivityRuleEditDialog';
import { useActivityRules } from '@/hooks/useActivityRules';
import type { Location } from '@/types/weather';
import type { ActivityRule, ActivityType } from '@/types/activity';

interface ActivityRulesManagerProps {
  locations: Location[];
  rules: ActivityRule[];
  onRulesChange?: () => void;
}

export const ActivityRulesManager = ({ locations, rules, onRulesChange }: ActivityRulesManagerProps) => {
  const [open, setOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<ActivityRule | null>(null);
  const { loading, addRule, updateRule, deleteRule, updatePriorities } = useActivityRules();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = rules.findIndex(r => r.id === active.id);
      const newIndex = rules.findIndex(r => r.id === over.id);
      
      const newOrder = arrayMove(rules, oldIndex, newIndex);
      await updatePriorities(newOrder.map(r => r.id));
      onRulesChange?.();
    }
  };

  const handleAddRule = async (rule: Parameters<typeof addRule>[0]) => {
    const result = await addRule(rule);
    if (!result.error) {
      onRulesChange?.();
    }
    return result;
  };

  const handleUpdateRule = async (ruleId: string, updates: {
    location_id: string;
    location_name: string;
    activity: ActivityType;
    min_gust: number;
    max_gust: number;
  }) => {
    const result = await updateRule(ruleId, updates);
    if (!result.error) {
      onRulesChange?.();
    }
    return result;
  };

  const handleDeleteRule = async (ruleId: string) => {
    const result = await deleteRule(ruleId);
    if (!result.error) {
      onRulesChange?.();
    }
    return result;
  };

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Settings2 className="w-4 h-4" />
            <span className="hidden sm:inline">Aktiviteter</span>
          </Button>
        </SheetTrigger>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Aktiviteter</SheetTitle>
            <SheetDescription>
              Definer regler for å få anbefalinger om aktivitet basert på vindforhold.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* Info box */}
            <div className="flex gap-3 p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
              <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p>
                Regler sjekkes i prioritetsrekkefølge. Dra og slipp for å endre prioritet. 
                Regelen øverst har høyest prioritet.
              </p>
            </div>

            {/* Add new rule form */}
            {locations.length > 0 ? (
              <ActivityRuleForm locations={locations} onSubmit={handleAddRule} />
            ) : (
              <div className="p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground text-center">
                Legg til steder i dashboardet for å opprette regler.
              </div>
            )}

            {/* Rules list */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                Dine regler ({rules.length})
              </h3>
              
              {loading ? (
                <div className="text-sm text-muted-foreground text-center py-4">
                  Laster...
                </div>
              ) : rules.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-4">
                  Ingen regler ennå. Legg til din første regel ovenfor.
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={rules.map(r => r.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {rules.map(rule => (
                        <ActivityRuleItem
                          key={rule.id}
                          rule={rule}
                          onEdit={setEditingRule}
                          onDelete={handleDeleteRule}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <ActivityRuleEditDialog
        rule={editingRule}
        locations={locations}
        open={editingRule !== null}
        onOpenChange={(open) => !open && setEditingRule(null)}
        onSave={handleUpdateRule}
      />
    </>
  );
};
