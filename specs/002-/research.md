# Research: Korean Localization for QuestLife

## 1. Internationalization (i18n) Strategy

**Decision**: React-i18next for frontend, custom solution for backend
**Rationale**: 
- React-i18next is the de facto standard for React i18n
- Lightweight, well-documented, excellent TypeScript support
- Supports lazy loading, namespaces, and interpolation
- Backend can use simple JSON files since content is mostly static

**Alternatives considered**:
- FormatJS/react-intl: More complex, overkill for Korean-only version
- Custom solution: Would reinvent the wheel, less maintainable
- Lingui: Less mature ecosystem, smaller community

## 2. Translation File Structure

**Decision**: Namespace-based JSON files with Korean-English hybrid approach
**Rationale**:
- Separate namespaces for UI, quests, classes, errors
- Easier to maintain and update specific sections
- Supports gaming convention of mixed languages

**Structure**:
```
locales/
├── ko/
│   ├── common.json      # UI elements
│   ├── quests.json      # Quest descriptions
│   ├── classes.json     # RPG classes
│   ├── errors.json      # Error messages
│   └── gaming.json      # Gaming terms (kept in English)
```

## 3. Date/Time Formatting

**Decision**: date-fns with Korean locale
**Rationale**:
- Lightweight, modular (tree-shakeable)
- Built-in Korean locale support
- Format: "YYYY년 MM월 DD일" easily achievable
- Already likely in use with React ecosystem

**Alternatives considered**:
- Moment.js: Deprecated, too heavy
- Intl.DateTimeFormat: Limited formatting options
- Day.js: Less feature-rich for Korean-specific needs

## 4. Number Formatting

**Decision**: Native Intl.NumberFormat
**Rationale**:
- Built-in browser API, no dependencies
- Supports international format (1,234)
- Consistent across all browsers
- Zero bundle size impact

## 5. Gaming Terms Strategy

**Decision**: Curated list of terms to keep in English
**Rationale**:
- Common gaming terms are universally understood
- Maintains gaming authenticity
- Reduces awkward translations

**English terms to keep**:
- Level, EXP, HP, MP, SP
- Quest, Skill, Class
- Buff, Debuff, Critical
- Combo, Streak
- Achievement, Badge

## 6. Mixed Text Rendering

**Decision**: Template literals with translation keys
**Rationale**:
- Allows flexible Korean-English mixing
- Example: `${t('strength')} (STR)` → "힘 (STR)"
- Maintains readability in code

## 7. LLM Integration for Korean

**Decision**: Prompt engineering for Korean responses
**Rationale**:
- OpenAI GPT-4 already supports Korean well
- Add locale context to prompts
- Response parsing remains the same

**Prompt modifications**:
- Add "Respond in Korean" instruction
- Include Korean gaming terminology context
- Specify mixed language output format

## 8. Database Considerations

**Decision**: No schema changes, translation at application layer
**Rationale**:
- Keep database in English for consistency
- Translate at API response level
- Easier debugging and maintenance
- No migration required

## 9. Font Selection

**Decision**: System fonts with Pretendard fallback
**Rationale**:
- Pretendard: Popular Korean font, excellent readability
- System fonts as primary for performance
- Web font as fallback for consistency

**Font stack**:
```css
font-family: -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", 
             Pretendard, Roboto, "Noto Sans KR", "Segoe UI", sans-serif;
```

## 10. Text Length Considerations

**Decision**: Flexible layouts with CSS grid/flexbox
**Rationale**:
- Korean text can be 15-30% shorter than English
- But mixed text might be longer
- Use min/max widths, text-overflow strategies
- Test with longest possible strings

## 11. Input Method Editor (IME) Support

**Decision**: Default browser IME handling
**Rationale**:
- Modern browsers handle Korean IME well
- No special configuration needed
- Test on-composition events for real-time validation

## 12. Testing Strategy

**Decision**: Parallel test suites for Korean locale
**Rationale**:
- Run existing tests with Korean locale
- Add specific Korean text rendering tests
- Visual regression tests for UI layouts
- E2E tests with Korean user flows

## Summary

All technical decisions prioritize:
1. Minimal changes to existing codebase
2. Maintainability and simplicity
3. Gaming industry conventions
4. Performance (no significant overhead)
5. Developer experience

No blocking technical challenges identified. Ready to proceed with implementation planning.