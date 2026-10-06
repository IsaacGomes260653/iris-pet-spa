"use client";

import { Component, type ReactNode } from "react";

/** Se o WebGL ou um modelo falhar, a cena some e o poster (que nunca saiu do DOM) continua no lugar. */
export class Seguro extends Component<{ children: ReactNode; aoFalhar: () => void }, { falhou: boolean }> {
  state = { falhou: false };
  static getDerivedStateFromError() {
    return { falhou: true };
  }
  componentDidCatch() {
    this.props.aoFalhar();
  }
  render() {
    return this.state.falhou ? null : this.props.children;
  }
}
