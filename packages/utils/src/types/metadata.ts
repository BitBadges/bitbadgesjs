import { IdRange } from "bitbadgesjs-proto";

export interface Metadata {
  name: string;
  description: string;
  image: string;
  creator?: string;
  validFrom?: IdRange; //start time in milliseconds to end time in milliseconds
  color?: string;
  type?: number;
  category?: string;
  externalUrl?: string;
  tags?: string[];
}
