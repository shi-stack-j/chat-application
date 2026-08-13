package com.shiv.chat_bakend.validation;

import com.ibm.icu.lang.UCharacter;
import com.ibm.icu.lang.UProperty;
import com.ibm.icu.text.BreakIterator;
import org.springframework.stereotype.Component;

import java.util.Locale;

@Component
public class EmojiValidator {

    public void validate(String emoji) {

        if (emoji == null || emoji.isBlank()) {
            throw new RuntimeException("Emoji is required");
        }

        if (containsWhitespace(emoji)) {
            throw new RuntimeException("Only one emoji is allowed");
        }

        if (!hasExactlyOneGraphemeCluster(emoji)) {
            throw new RuntimeException(
                    "Only one emoji is allowed"
            );
        }

        if (!containsEmoji(emoji)) {
            throw new RuntimeException(
                    "The provided value is not a valid emoji"
            );
        }
    }

    private boolean hasExactlyOneGraphemeCluster(String value) {

        BreakIterator iterator =
                BreakIterator.getCharacterInstance(Locale.ROOT);

        iterator.setText(value);

        int count = 0;

        while (true) {

            int end = iterator.next();

            if (end == BreakIterator.DONE) {
                break;
            }

            count++;

            if (count > 1) {
                return false;
            }
        }

        return count == 1;
    }

    private boolean containsEmoji(String value) {

        return value.codePoints()
                .anyMatch(codePoint ->
                        UCharacter.hasBinaryProperty(
                                codePoint,
                                UProperty.EMOJI
                        )
                );
    }

    private boolean containsWhitespace(String value) {

        return value.codePoints()
                .anyMatch(Character::isWhitespace);
    }
}
