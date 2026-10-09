class Matrix {
    constructor(rows, cols) {
        this.rows = rows;
        this.cols = cols;

        // Creates an array with length n (rows), for which each row has length m (cols) with value 0
        this.data = Array.from({ length : rows }, () => Array(cols).fill(0))
    }

    // Helper to initialize Matrix directly
    static create(arr) {
        const m = new Matrix(arr.length, arr[0].length)
        m.data = arr;
        return m;
    }

    get(r, c) {
        return this.data[r - 1][c - 1];
    }

    set(r, c, value) {
        this.data[r - 1][c - 1] = value;
    }

    // ---- OPERATIONS ----
    multiply(m) {
        if (this.cols != m.rows) {
            console.log("# columns is not equal to # rows")
            throw new Error("Undefined product.")
        }

        let product = new Matrix(this.rows, m.cols);

        // Row i of matrix B
        for (let i = 1; i < this.rows + 1; i++) {
            // Column j of matrix A
            for (let j = 1; j < m.cols + 1; j++) {
                let sum = 0;
                // Row k of matrix A
                for (let k = 1; k < this.cols + 1; k++) {
                    let m_value = m.get(k, j);
                    let this_value = this.get(i, k);

                    sum += this.get(i, k) * m.get(k, j);
                }
                product.set(i, j, sum);
                sum = 0;
            }
        };
        return product.data;
    }
}