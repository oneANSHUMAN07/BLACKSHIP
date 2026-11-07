export interface FeatureItem {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  description: string;
  metrics: string;
  tags: string[];
  capabilities: string[];
}

export interface StepItem {
  number: string;
  title: string;
  tagline: string;
  description: string;
  deliverables: string[];
  interfaceSnippet: {
    badge: string;
    action: string;
    details: string;
  };
}

export interface PartnerBrand {
  name: string;
  symbol: string;
  descriptor: string;
}
