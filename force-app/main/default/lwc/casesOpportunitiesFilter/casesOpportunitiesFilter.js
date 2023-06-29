import { LightningElement, wire } from 'lwc';
import { getPicklistValues } from 'lightning/uiObjectInfoApi';
import Case_Field from '@salesforce/schema/Case.Status';
import Opportunity_Field from '@salesforce/schema/Opportunity.StageName';

import getAccounts from '@salesforce/apex/AccountController.getAccounts';

const COLUMNS = [
    { 
        label: 'Account Name', 
        fieldName: 'accountLink', 
        type: 'url', 
        typeAttributes: { label: { fieldName: 'Name'}, target: '_blank' }
    },
    { label: 'Rating', fieldName: 'Rating', type: 'text', sortable: 'true' },
    { label: 'Phone', fieldName: 'Phone', type: 'phone' }
];

export default class CasesOpportunitiesFilter extends LightningElement {
    caseStatus;
    opportunityStage;
    caseStatuses = [];
    opportunityStages = [];

    columns = COLUMNS;

    accounts;

    fieldApiName = Case_Field;

    rowCount;
    sortBy;
    sortDirection;

    /* 
    THIS PART TOOK FOREVER.

    I was using getObjectInfos to try to pull the recordTypeId dynamically, which caused a ton of roadblocks.

    the lwc-dev-server instance of @salesforce DOES NOT EXPORT getObjectInfos (plural form) as an importable method, so that just wouldn't work in the dev server.
    (Wasted several hours on this)

    The lwc-dev-server also had an error when running getAccounts later. Something like "Could not read Aura token response". 
    */

    @wire(getPicklistValues, {recordTypeId: '012000000000000AAA', fieldApiName: '$fieldApiName' })
    wiredPicklistValues({ data }) {
        let values = [];
        // console.log("CASE FIELD RUNNING")
        // console.log(data)
        if (data) {
            let fields = data.values;
            for (let i = 0; i < fields.length; i++) {
                values.push(fields[i]);
            }
            if (this.fieldApiName !== Opportunity_Field) {
                this.caseStatuses = values;
                this.fieldApiName = Opportunity_Field;
                // console.log("case Statuses updated!")
            } else {
                this.opportunityStages = values;
                // console.log("opp Stages updated!")
            }
        }
    }

    // both of these handlers check to make sure the opposite field is not empty before running filterAccounts()
    handleStatusChange(event) {
        this.caseStatus = event.detail.value;
        // console.log("Case Status changed to: " + this.caseStatus)
        if (this.opportunityStage) {
            this.filterAccounts();
        }
    }

    handleStageChange(event) {
        this.opportunityStage = event.detail.value;
        // console.log("Opportunity Stage changed to: " + this.opportunityStage)
        if (this.caseStatus) {
            this.filterAccounts();
        }
    }

    filterAccounts() {
        // execute apex to get filtered list of accounts
        getAccounts({
            caseStatus: this.caseStatus,
            opportunityStage: this.opportunityStage
        })
            .then(result => {
                result = JSON.parse(JSON.stringify(result));
                // attach link to account Name. code adapted from https://techdicer.com/add-hyperlink-column-in-lwc-datatable/
                result.forEach(res => {
                    res.accountLink = '/' + res.Id;
                });

                this.accounts = result;
                this.rowCount = this.accounts.length;
            })
            .catch(error => {
                console.log(error);
                this.accounts = undefined;
            });
    }

    /* 
    WIP: cannot get this to work with Account Name due to fieldName returning "accountLink" because of url functionality.

    Rating column sorting Cold, Hot, Warm based on alphabetical order (C, H, W). For now, this should at least demonstrate some sortability implemented.

    code taken directly from https://www.apexhours.com/lightning-datatable-sorting-in-lightning-web-components/
    */

    doSorting(event) {
        this.sortBy = event.detail.fieldName;
        this.sortDirection = event.detail.sortDirection;
        this.sortData(this.sortBy, this.sortDirection);
    }

    sortData(fieldname, direction) {
        let parseAccounts = JSON.parse(JSON.stringify(this.accounts));
        // Return the value stored in the field
        let keyValue = (a) => {
            return a[fieldname];
        };
        // cheking reverse direction
        let isReverse = direction === 'asc' ? 1: -1;
        // sorting data
        parseAccounts.sort((x, y) => {
            x = keyValue(x) ? keyValue(x) : ''; // handling null values
            y = keyValue(y) ? keyValue(y) : '';
            // sorting values based on direction
            return isReverse * ((x > y) - (y > x));
        });
        this.accounts = parseAccounts;
    }    
}
