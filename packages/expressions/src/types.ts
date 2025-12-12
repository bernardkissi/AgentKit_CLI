export interface ExpressionOccurrence {
	/** JSONPath pointing to the string field that contained the expression */
	jsonPath: string;
	/** The full raw expression content inside {{ ... }} */
	expr: string;
}
