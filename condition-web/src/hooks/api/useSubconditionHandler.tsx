import { useState } from "react";
import { SubconditionModel } from "@/models/Subcondition";

export const useSubconditionHandler = (initialSubconditions: SubconditionModel[] = []) => {
  const [subconditions, setSubconditions] = useState<SubconditionModel[]>(initialSubconditions);
  const [changedValues, setChangedValues] = useState<{ [key: string]: Partial<SubconditionModel> }>({});

  const handleEdit = (id: string, newIdentifier: string, newText: string) => {
    const updateSubcondition = (subconds: SubconditionModel[]): SubconditionModel[] => {
      return subconds.map((sub) => {
        if (sub.subcondition_id === id) {
          setChangedValues((prev) => ({
            ...prev,
            [id]: { ...prev[id], subcondition_identifier: newIdentifier, subcondition_text: newText },
          }));
          return { ...sub, subcondition_identifier: newIdentifier, subcondition_text: newText };
        }
        if (sub.subconditions) {
          return { ...sub, subconditions: updateSubcondition(sub.subconditions) };
        }
        return sub;
      });
    };

    setSubconditions(updateSubcondition(subconditions));
  };

  const handleAdd = (targetId: string) => {
    const addSubcondition = (subconds: SubconditionModel[] | undefined): SubconditionModel[] => {
      return (subconds || []).map((sub) => {
        if (sub.subcondition_id === targetId) {
          const existingCount = sub.subconditions?.length || 0;
          const newSubcondition: SubconditionModel = {
            subcondition_id: `${targetId}-${Date.now()}`,
            subcondition_identifier: "",
            subcondition_text: "",
            sort_order: existingCount + 1,
            subconditions: [],
          };

          return {
            ...sub,
            subconditions: [...(sub.subconditions || []), newSubcondition],
          };
        }

        return {
          ...sub,
          subconditions: addSubcondition(sub.subconditions),
        };
      });
    };

    setSubconditions((prev) => addSubcondition(prev));
  };

  const handleDelete = (id: string) => {
    const deleteSubcondition = (subconds: SubconditionModel[]): SubconditionModel[] => {
      return subconds
        .filter((sub) => sub.subcondition_id !== id)
        .map((sub) => ({
          ...sub,
          subconditions: sub.subconditions ? deleteSubcondition(sub.subconditions) : sub.subconditions,
        }));
    };

    setSubconditions(deleteSubcondition(subconditions));
  };

  const handleAddParentCondition = () => {
    setSubconditions((prev) => {
      const newCondition: SubconditionModel = {
        subcondition_id: `parent-${Date.now()}`,
        subcondition_identifier: "",
        subcondition_text: "",
        sort_order: prev.length + 1, // dynamic sort_order
        subconditions: [],
      };
  
      return [...prev, newCondition];
    });
  };

  return {
    subconditions,
    setSubconditions,
    changedValues,
    handleEdit,
    handleAdd,
    handleDelete,
    handleAddParentCondition,
  };
};
