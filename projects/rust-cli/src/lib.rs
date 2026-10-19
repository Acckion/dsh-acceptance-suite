pub fn fib(n: u32) -> u64 {
    let mut a: u64 = 0;
    let mut b: u64 = 1;
    for _ in 0..n {
        let next = a + b;
        a = b;
        b = next;
    }
    a
}

pub fn is_palindrome(input: &str) -> bool {
    let cleaned: String = input
        .chars()
        .filter(|c| c.is_alphanumeric())
        .flat_map(|c| c.to_lowercase())
        .collect();
    let reversed: String = cleaned.chars().rev().collect();
    cleaned == reversed
}

#[cfg(test)]
mod tests {
    use super::{fib, is_palindrome};

    #[test]
    fn fib_sequence() {
        assert_eq!(fib(0), 0);
        assert_eq!(fib(1), 1);
        assert_eq!(fib(10), 55);
    }

    #[test]
    fn palindrome_checks() {
        assert!(is_palindrome("A man, a plan, a canal: Panama"));
        assert!(!is_palindrome("hello"));
    }
}
