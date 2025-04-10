type CategoryMapping = {
  pageName?: string;
  slugs: Record<string, string>;
};

// Define the mappings outside of the function to avoid redefining it on every function call
const endpointsMappings: Record<string, CategoryMapping> = {
  materials: {
    pageName: "Материали",
    slugs: { "1": "Мрамор", "2": "Гранит", "3": "Оникс", "4": "Варовик" },
  },
  edges: {
    pageName: "Обработки",
    slugs: {},
  },
  contact: {
    pageName: "Контакти",
    slugs: {},
  },
};

export const fetchEntityName = async (
  type: string,
  id: string
): Promise<string> => {
  const category = endpointsMappings[type];

  if (category) {
    return `${category.pageName}/${category.slugs[id]}`; // Use pageName if available
  }

  return `${type} ${id}`; // Default fallback
};
