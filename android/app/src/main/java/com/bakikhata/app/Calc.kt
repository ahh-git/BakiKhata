package com.bakikhata.app

import java.text.DecimalFormat
import java.text.DecimalFormatSymbols
import java.util.Locale
import kotlin.math.round

object Calc {
    fun liveEval(input: String): Double? {
        val raw = input.trim()
        if (raw.isEmpty()) return null
        // Only allow digits, +, -, *, /, (, ), ., and spaces
        if (!raw.matches(Regex("^[0-9+\\-*/().\\s]+$"))) return null

        return try {
            val parser = MathParser(raw)
            val result = parser.parse()
            if (result.isNaN() || result.isInfinite()) null
            else round(result * 100.0) / 100.0
        } catch (_: Exception) {
            null
        }
    }

    fun money(n: Double): String {
        val symbols = DecimalFormatSymbols(Locale.US)
        val df = if (n % 1.0 == 0.0) {
            DecimalFormat("#,##0", symbols)
        } else {
            DecimalFormat("#,##0.##", symbols)
        }
        val formatted = df.format(n)
        return toBengaliNumerals(formatted)
    }

    fun toBengaliNumerals(str: String): String {
        val bengaliDigits = charArrayOf('০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯')
        val sb = StringBuilder()
        for (c in str) {
            if (c in '0'..'9') {
                sb.append(bengaliDigits[c - '0'])
            } else {
                sb.append(c)
            }
        }
        return sb.toString()
    }

    // Mathematical expression parser (recursive descent)
    private class MathParser(val str: String) {
        var pos = -1
        var ch = 0

        fun nextChar() {
            ch = if (++pos < str.length) str[pos].code else -1
        }

        fun eat(charToEat: Int): Boolean {
            while (ch == ' '.code) nextChar()
            if (ch == charToEat) {
                nextChar()
                return true
            }
            return false
        }

        fun parse(): Double {
            nextChar()
            val x = parseExpression()
            if (pos < str.length) throw RuntimeException("Unexpected: " + ch.toChar())
            return x
        }

        fun parseExpression(): Double {
            var x = parseTerm()
            while (true) {
                when {
                    eat('+'.code) -> x += parseTerm()
                    eat('-'.code) -> x -= parseTerm()
                    else -> return x
                }
            }
        }

        fun parseTerm(): Double {
            var x = parseFactor()
            while (true) {
                when {
                    eat('*'.code) -> x *= parseFactor()
                    eat('/'.code) -> x /= parseFactor()
                    else -> return x
                }
            }
        }

        fun parseFactor(): Double {
            if (eat('+'.code)) return +parseFactor()
            if (eat('-'.code)) return -parseFactor()

            var x: Double
            val startPos = pos
            if (eat('('.code)) {
                x = parseExpression()
                if (!eat(')'.code)) throw RuntimeException("Missing ')'")
            } else if ((ch in '0'.code..'9'.code) || ch == '.'.code) {
                while ((ch in '0'.code..'9'.code) || ch == '.'.code) nextChar()
                x = str.substring(startPos, pos).toDouble()
            } else {
                throw RuntimeException("Unexpected: " + ch.toChar())
            }

            return x
        }
    }
}
