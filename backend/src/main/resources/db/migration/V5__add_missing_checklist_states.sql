ALTER TABLE user_checklist_item DROP CHECK chk_user_checklist_state;

ALTER TABLE user_checklist_item ADD CONSTRAINT chk_user_checklist_state
    CHECK (state IN ('NOT_REVIEWED', 'AVAILABLE', 'NEEDS_VERIFICATION', 'MISSING',
                     'UPDATE_REQUIRED', 'IN_PROGRESS', 'COMPLETED', 'NOT_APPLICABLE'));
