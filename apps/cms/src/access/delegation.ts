// HITL delegation: a user inherits the approval authority of anyone who has
// delegated to them AND is currently out of office. Returns the union of the
// user's own roles plus those inherited roles — used to decide approval stages.
export async function effectiveApproverRoles(user: any, payload: any): Promise<{ roles: string[]; delegatedFrom: string[] }> {
  const own: string[] = user?.roles ?? [];
  try {
    const res = await payload.find({
      collection: "users",
      where: { and: [{ delegateApprovalsTo: { equals: user.id } }, { outOfOffice: { equals: true } }] },
      limit: 50,
      depth: 0,
      overrideAccess: true,
    });
    const delegators = res.docs || [];
    const inherited = delegators.flatMap((d: any) => d.roles || []);
    const delegatedFrom = delegators.map((d: any) => d.email || String(d.id));
    return { roles: Array.from(new Set([...own, ...inherited])), delegatedFrom };
  } catch {
    return { roles: own, delegatedFrom: [] };
  }
}
