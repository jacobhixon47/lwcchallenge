public with sharing class AccountController {

    @AuraEnabled(cacheable=true)

    public static List<Account> getAccounts(String caseStatus, String opportunityStage) {

        List<Account> accounts = new List<Account>();

        accounts = [
            SELECT Id, Name, Rating, Phone
            FROM Account
            WHERE Id IN (
                SELECT AccountId
                FROM Case
                WHERE Status = :caseStatus
            )
            AND Id IN (
                SELECT AccountId
                FROM Opportunity
                WHERE StageName = :opportunityStage
            ) WITH SECURITY_ENFORCED];

        return accounts;
    }
}