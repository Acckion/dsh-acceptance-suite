use suite_rust_cli::fib;

#[test]
fn larger_fib_values() {
    assert_eq!(fib(20), 6765);
}
