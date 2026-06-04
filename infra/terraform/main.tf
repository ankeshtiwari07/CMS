# HUMAIN platform infra — KSA region, generic Kubernetes target.
# Pin your provider (e.g. AWS me-central-1, or sovereign cloud) in providers.tf.
terraform { required_version = ">= 1.6" }

variable "region"        { default = "me-central-1" } # KSA
variable "cluster_name"  { default = "humain-prod" }
variable "environment"   { default = "production" }

# Networking, K8s cluster, managed Postgres(+pgvector), Redis, OpenSearch,
# object storage and secrets manager are declared in the modules below.
module "network"    { source = "./modules/network"   region = var.region }
module "kubernetes" { source = "./modules/kubernetes" name   = var.cluster_name  region = var.region }
module "postgres"   { source = "./modules/postgres"   region = var.region  pgvector = true }
module "redis"      { source = "./modules/redis"      region = var.region }
module "opensearch" { source = "./modules/opensearch" region = var.region }
module "objectstore"{ source = "./modules/objectstore" region = var.region  bucket = "humain-media" }

output "kubeconfig" { value = module.kubernetes.kubeconfig  sensitive = true }
