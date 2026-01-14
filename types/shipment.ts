export interface Shipment {
  id: string;
  importer_name: string;
  importer_website: string;
  importer_country: string;
  exporter_name: string;
  exporter_website: string;
  exporter_country: string;
  shipment_date: string;
  commodity_name: string;
  industry_sector: string;
  weight_metric_tonnes: number;
}
